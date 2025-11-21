import { redis } from "../db/redis.js";

export async function loginHandler(ws, payload) {
  const { username, password } = payload;

  const user = await redis.hGetAll(`user:${username}`);

  if (user && user.password === password) {
    ws.send(JSON.stringify({ type: "ok", payload: { message: "Login exitoso" } }));
  } else {
    ws.send(JSON.stringify({ type: "error", payload: { message: "Credenciales inválidas" } }));
  }
}
