import { AudioDecoder } from "./decoder.js";
import { PlayerNode } from "./player-node.js";

export async function setupRecver({ opusHeaderPackets }) {
  const decoder = new AudioDecoder("./worker/opus_decode_worker.js");

  const decoderInfo = await decoder.setup(opusHeaderPackets);

  console.log("[recver] setup decoder w/", decoderInfo);

  return { decoder };
}

export async function runRecver({ decoder, sampleRate }) {
  const recver = new BroadcastChannel("opus");

  const audioContext = new AudioContext({ sampleRate });
  const playerNode = new PlayerNode(audioContext);
  playerNode.connect(audioContext.destination);

  recver.onmessage = async ({ data }) => {
    for (const packet of data) {
      const { samples } = await decoder.decode(packet);
      playerNode.enqueueSamples(samples);
    }
  };

  window.player = playerNode;
}
