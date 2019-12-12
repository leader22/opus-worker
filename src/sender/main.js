import { AudioEncoder } from "./encoder.js";

export async function setupSender() {
  const encoder = new AudioEncoder("./worker/opus_encode_worker.js");

  const encoderConfig = {
    // same as params to skip resampling
    sampling_rate: 48000,
    num_of_channels: 1,
    params: {
      application: 2048, // 2048: VoIP | 2049: Audio | 2051: RestrictedLowDelay
      sampling_rate: 48000, // Hz: 8000 | 12000 | 16000 | 24000 | 48000
      frame_duration: 20, // ms: 2.5 | 5 | 10 | 20 | 40 | 60
    }
  };

  const opusHeaderPackets = await encoder.setup(encoderConfig);
  console.log("[sender] setup w/", encoderConfig);

  return { encoder, opusHeaderPackets };
}

export async function runSender({ encoder }) {
  const sender = new BroadcastChannel("opus");

  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const sampleRate = 48000;
  const audioContext = new AudioContext({ sampleRate });

  const sourceNode = audioContext.createMediaStreamSource(mediaStream);
  // 0 = auto bufferSize / 1 input channel / 1 output channel(required)
  const sendNode = audioContext.createScriptProcessor(0, 1, 1);
  sendNode.onaudioprocess = async ({ inputBuffer }) => {
    // Float32Array: auto size is 1024 by auto in Chrome
    // here monoural
    const samples = inputBuffer.getChannelData(0);

    // into opus
    const packets = await encoder.encode(samples);
    if (packets.length === 0) return;

    // send w/ networiking shim
    setTimeout(() => sender.postMessage(packets), Math.random() * 10);
  };

  sourceNode
    .connect(sendNode)
    .connect(audioContext.destination);

  // setTimeout(() => {
  //   sourceNode.disconnect();
  //   sendNode.disconnect();
  // }, 1000);
}
