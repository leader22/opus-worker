export const TRANSPORT_TYPES = {
  BROADCAST_CHANNEL: 1,
  WEBSOCKET: 2
};

export async function createTransport(type, channelId = Date.now()) {
  if (type === TRANSPORT_TYPES.BROADCAST_CHANNEL) {
    const ch = new BroadcastChannel(channelId);
    ch.send = ch.postMessage.bind(ch);
    return Promise.resolve(ch);
  }

  if (type === TRANSPORT_TYPES.WEBSOCKET) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(channelId);
      ws.binaryType = "arraybuffer";

      ws.onopen = () => resolve(ws);
      ws.onerror = err => reject(err);
    });
  }

  throw new Error("Undefined transport type!");
}
