import { redis } from "../db/redis.js";

export async function registerHandler(ws, payload) {
  const { username, password } = payload;

  if (!username || !password) {
    return ws.send(JSON.stringify({ type: "error", payload: { message: "Datos incompletos" } }));
  }

  // Guardar usuario en Redis
  await redis.hSet(`user:${username}`, { username, password });

  ws.send(JSON.stringify({ type: "ok", payload: { message: "Usuario registrado" } }));
}
