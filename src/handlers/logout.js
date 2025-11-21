import { redis } from "../db/redis.js";

export async function logoutHandler(ws, payload) {
  const { username } = payload;

  if (!username) {
    return ws.send(
      JSON.stringify({ type: "error", payload: { message: "Falta el username" } })
    );
  }

  try {
    // Elimina la sesión del usuario en Redis
    await redis.del(`session:${username}`);

    ws.send(
      JSON.stringify({ type: "ok", payload: { message: "Logout exitoso" } })
    );
  } catch (err) {
    ws.send(
      JSON.stringify({
        type: "error",
        payload: { message: "Error en logout", details: err.message },
      })
    );
  }
}
