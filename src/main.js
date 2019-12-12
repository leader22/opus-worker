import { setupSender, runSender } from "./sender/main.js";
import { setupRecver, runRecver } from "./recver/main.js";

(async () => {
  const { encoder, opusHeaderPackets } = await setupSender();
  console.log("[sender] setup done!");

  const { decoder } = await setupRecver({ opusHeaderPackets });
  console.log("[recver] setup done!");

  const [$runSender, $runRecver] = document.querySelectorAll("button");

  $runSender.onclick = () => runSender({ encoder });
  $runRecver.onclick = () => runRecver({ decoder });
})();
