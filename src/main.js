import { setupSender, runSender } from "./sender/main.js";
import { setupRecver, runRecver } from "./recver/main.js";

(async () => {
  const sampleRate = 48000;
  console.log("[main] use sampleRate", sampleRate);

  const { encoder, opusHeaderPackets } = await setupSender({ sampleRate });
  console.log("[sender] setup done!");

  const { decoder } = await setupRecver({ opusHeaderPackets });
  console.log("[recver] setup done!");

  const [$runSender, $runRecver] = document.querySelectorAll("button");

  $runSender.onclick = () => runSender({ encoder, sampleRate });
  $runRecver.onclick = () => runRecver({ decoder, sampleRate });
})();
