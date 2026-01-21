-- KEYS:
-- 1 = sec key
-- 2 = min key
-- 3 = hour key
--
-- ARGV:
-- 1 = cost
-- 2 = sec_limit
-- 3 = min_limit
-- 4 = hour_limit
-- 5 = sec_ttl
-- 6 = min_ttl
-- 7 = hour_ttl

local cost = tonumber(ARGV[1])

local sec_key = KEYS[1]
local min_key = KEYS[2]
local hour_key = KEYS[3]

local sec_limit = tonumber(ARGV[2])
local min_limit = tonumber(ARGV[3])
local hour_limit = tonumber(ARGV[4])

local sec_ttl = tonumber(ARGV[5])
local min_ttl = tonumber(ARGV[6])
local hour_ttl = tonumber(ARGV[7])

-- Read current counters (0 if missing)
local sec_cur = tonumber(redis.call("GET", sec_key) or "0")
local min_cur = tonumber(redis.call("GET", min_key) or "0")
local hour_cur = tonumber(redis.call("GET", hour_key) or "0")

-- Check limits
if (sec_cur + cost) > sec_limit then
  return {0, redis.call("PTTL", sec_key)}
end

if (min_cur + cost) > min_limit then
  return {0, redis.call("PTTL", min_key)}
end

if (hour_cur + cost) > hour_limit then
  return {0, redis.call("PTTL", hour_key)}
end

-- All allowed: increment
local new_sec = redis.call("INCRBY", sec_key, cost)
if new_sec == cost then
  redis.call("EXPIRE", sec_key, sec_ttl)
end

local new_min = redis.call("INCRBY", min_key, cost)
if new_min == cost then
  redis.call("EXPIRE", min_key, min_ttl)
end

local new_hour = redis.call("INCRBY", hour_key, cost)
if new_hour == cost then
  redis.call("EXPIRE", hour_key, hour_ttl)
end

return {1, 0}
