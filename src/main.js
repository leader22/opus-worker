import { setupSender, runSender } from "./sender/main.js";
import { setupRecver, runRecver } from "./recver/main.js";

(async () => {
  const sampleRate = 48000;
  const numOfChannels = 2;
  console.log("[main] use", { sampleRate, numOfChannels });

  const { encoder, opusHeaderPackets } = await setupSender({ sampleRate, numOfChannels });
  console.log("[sender] setup done!");

  const { decoder } = await setupRecver({ opusHeaderPackets });
  console.log("[recver] setup done!");

  const [$runSender, $runRecver] = document.querySelectorAll("button");

  $runSender.onclick = () => runSender({ encoder, sampleRate, numOfChannels });
  $runRecver.onclick = () => runRecver({ decoder, sampleRate, numOfChannels });
})();
