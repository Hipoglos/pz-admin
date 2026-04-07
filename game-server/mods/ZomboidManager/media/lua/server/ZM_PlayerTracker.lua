--
-- ZM_PlayerTracker.lua
-- Writes online player positions to players_live.json every 10 seconds.
-- The pz-admin backend reads this file to show players on the live map.
--
-- Install: copy the ZomboidManager folder to your PZ server's mods directory
-- and add "ZomboidManager" to your server's Mods= and WorkshopItems= in servertest.ini
--

local POSITIONS_FILE = "players_live.json"
local UPDATE_INTERVAL = 10  -- seconds

local lastUpdate = 0

-- Simple JSON encoder (no external dependency)
local function jsonVal(v)
    local t = type(v)
    if t == "nil" then return "null"
    elseif t == "boolean" then return v and "true" or "false"
    elseif t == "number" then
        if v ~= v then return "null" end  -- NaN
        return string.format("%.4f", v)
    elseif t == "string" then
        return '"' .. v:gsub('\\', '\\\\'):gsub('"', '\\"'):gsub('\n', '\\n') .. '"'
    elseif t == "table" then
        -- Check if array
        if #v > 0 then
            local parts = {}
            for _, item in ipairs(v) do
                table.insert(parts, jsonVal(item))
            end
            return "[" .. table.concat(parts, ",") .. "]"
        else
            local parts = {}
            for k, val in pairs(v) do
                table.insert(parts, '"' .. tostring(k) .. '":' .. jsonVal(val))
            end
            return "{" .. table.concat(parts, ",") .. "}"
        end
    end
    return "null"
end

local function getTimestamp()
    local cal = Calendar.getInstance()
    return string.format("%04d-%02d-%02dT%02d:%02d:%02d",
        cal:get(Calendar.YEAR),
        cal:get(Calendar.MONTH) + 1,
        cal:get(Calendar.DAY_OF_MONTH),
        cal:get(Calendar.HOUR_OF_DAY),
        cal:get(Calendar.MINUTE),
        cal:get(Calendar.SECOND))
end

local function exportPositions()
    local onlinePlayers = getOnlinePlayers()
    if not onlinePlayers then return end

    local playerList = {}
    for i = 0, onlinePlayers:size() - 1 do
        local player = onlinePlayers:get(i)
        if player then
            table.insert(playerList, {
                username  = player:getUsername() or "unknown",
                name      = player:getUsername() or "unknown",
                x         = math.floor((player:getX() or 0) * 10) / 10,
                y         = math.floor((player:getY() or 0) * 10) / 10,
                z         = math.floor(player:getZ() or 0),
                online    = true,
                is_dead   = player:isDead() or false,
            })
        end
    end

    local data = {
        timestamp = getTimestamp(),
        players   = playerList,
    }

    local jsonStr = jsonVal(data)

    local writer = getFileWriter(POSITIONS_FILE, true, false)
    if not writer then
        print("[ZomboidManager] ERROR: cannot write " .. POSITIONS_FILE)
        return
    end
    writer:write(jsonStr)
    writer:close()
end

-- Hook into server tick
Events.OnTickEvenPaused.Add(function()
    local now = getTimestamp and os.time() or 0
    if now - lastUpdate >= UPDATE_INTERVAL then
        lastUpdate = now
        local ok, err = pcall(exportPositions)
        if not ok then
            print("[ZomboidManager] PlayerTracker error: " .. tostring(err))
        end
    end
end)

print("[ZomboidManager] PlayerTracker loaded — writing positions to " .. POSITIONS_FILE)
