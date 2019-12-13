import { AudioDecoder } from "./decoder.js";
import { PlayerNode } from "./player-node/index.js";

export async function setupRecver({ opusHeaderPackets }) {
  const decoder = new AudioDecoder("./worker/opus_decode_worker.js");

  const decoderInfo = await decoder.setup(opusHeaderPackets);

  console.log("[recver] setup decoder w/", decoderInfo);

  return { decoder };
}

export async function runRecver({ decoder, recvTransport, sampleRate, numOfChannels }) {
  const audioContext = new AudioContext({ sampleRate });
  const playerNode = new PlayerNode(audioContext, { numOfChannels });
  playerNode.connect(audioContext.destination);
  playerNode.start();

  const chunk = [];
  let len = 0;
  recvTransport.onmessage = async ({ data }) => {
    // for (const packet of data) {
    //   const { samples } = await decoder.decode(packet.data);
    //   playerNode.enqueue(samples);
    // }
    if (typeof data === "string") {
      len = Number(data);

      for (const packet of chunk) {
        if (packet.byteLength === 0) continue;

        const { samples } = await decoder.decode(packet);
        playerNode.enqueue(samples);
      }
      chunk.length = 0;
      return;
    }

    if (chunk.length !== len) {
      chunk.push(data);
    }
  };

  window.player = playerNode;
}
