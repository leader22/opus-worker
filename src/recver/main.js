import { AudioDecoder } from "./decoder.js";
import { PlayerNode } from "./player-node.js";

export async function setupRecver({ opusHeaderPackets }) {
  const decoder = new AudioDecoder("./worker/opus_decode_worker.js");

  const decoderInfo = await decoder.setup(opusHeaderPackets);

  console.log(decoderInfo);

  return { decoder };
}

export async function runRecver({ decoder }) {
  const recver = new BroadcastChannel("opus");

  const sampleRate = 48000;
  const audioContext = new AudioContext({ sampleRate });

  const playerNode = new PlayerNode(audioContext);
  playerNode.connect(audioContext.destination);

  recver.onmessage = async ({ data }) => {
    for (const packet of data) {
      const { samples } = await decoder.decode(packet);
      playerNode.enqueue(samples);
    }
  };

  // playerNode.start();
}
