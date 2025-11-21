export function pingHandler(ws) {
  ws.send(
    JSON.stringify({ type: "pong", payload: { time: Date.now() } })
  );
}
