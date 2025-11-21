import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { redis } from "../db/redis.js";
import { pingHandler } from "../handlers/ping.js";
import { redisTestHandler } from "../handlers/redisTest.js";
import { registerHandler } from "../handlers/register.js";
import { loginHandler } from "../handlers/login.js";
import { logoutHandler } from "../handlers/logout.js";

dotenv.config();

const WS_PORT = process.env.WS_PORT || 8080;

export function startServer() {
  const wss = new WebSocketServer({ port: WS_PORT });
  console.log(`Servidor WebSocket escuchando en ws://localhost:${WS_PORT}`);

  wss.on("connection", (ws) => {
    console.log("Cliente conectado");

    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return ws.send(
          JSON.stringify({
            type: "error",
            payload: { message: "JSON inválido" },
          })
        );
      }

      const { type, payload } = msg;

      switch (type) {
        //handler para ping
        case "ping":
          return pingHandler(ws);
        //Handler para probar Redis
        case "redis-test":
          return redisTestHandler(ws);
        // Handler para registrar usuario
        case "register":
          return registerHandler(ws, payload);
        // Handler para iniciar sesión
        case "login":
          return loginHandler(ws, payload);
        case "logout":
          return logoutHandler(ws, payload);
        default:
          return ws.send(
            JSON.stringify({
              type: "error",
              payload: { message: `Tipo de mensaje no soportado: ${type}` },
            })
          );
      }
    });

    ws.on("close", () => {
      console.log("Cliente desconectado");
    });
  });
}
