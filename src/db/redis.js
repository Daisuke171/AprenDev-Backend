import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();


const redis = createClient({ url: process.env.REDIS_URL });

export async function connectRedis() {
  redis.on("error", (err) => console.error("Redis error", err));
  await redis.connect();
  console.log("Redis conectado");
}

export { redis };
