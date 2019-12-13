import { setupSender, runSender } from "./sender/main.js";
import { setupRecver, runRecver } from "./recver/main.js";
import { createTransport, TRANSPORT_TYPES } from "./transport/index.js";

(async () => {
  // for Safari
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  const sampleRate = 48000;
  const numOfChannels = 2;
  console.log("[main] use", { sampleRate, numOfChannels });

  const { encoder, opusHeaderPackets } = await setupSender({ sampleRate, numOfChannels });
  console.log("[sender] setup done!");

  const { decoder } = await setupRecver({ opusHeaderPackets });
  console.log("[recver] setup done!");

  const sendTransport = await createTransport(TRANSPORT_TYPES.BROADCAST_CHANNEL, "opus");
  const recvTransport = await createTransport(TRANSPORT_TYPES.BROADCAST_CHANNEL, "opus");
  // const sendTransport = await createTransport(TRANSPORT_TYPES.WEBSOCKET, "ws://localhost:8080");
  // const recvTransport = await createTransport(TRANSPORT_TYPES.WEBSOCKET, "ws://localhost:8080");

  const [$runSender, $runRecver] = document.querySelectorAll("button");

  $runSender.onclick = () => runSender({ encoder, sendTransport, sampleRate, numOfChannels });
  $runRecver.onclick = () => runRecver({ decoder, recvTransport, sampleRate, numOfChannels });
})();
