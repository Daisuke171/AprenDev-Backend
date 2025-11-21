import { redis } from "../db/redis.js";

export async function redisTestHandler(ws) {
  try {
    await redis.set("test:key", "valor");
    const val = await redis.get("test:key");
    ws.send(JSON.stringify({ type: "ok", payload: { redis: val } }));
  } catch (err) {
    ws.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Redis error", details: err.message },
      })
    );
  }
}
