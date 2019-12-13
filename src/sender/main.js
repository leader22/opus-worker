import { AudioEncoder } from "./encoder.js";

export async function setupSender({ sampleRate, numOfChannels }) {
  const encoder = new AudioEncoder("./worker/opus_encode_worker.js");

  const encoderConfig = {
    // same as params to skip resampling
    sampling_rate: sampleRate,
    num_of_channels: numOfChannels,
    params: {
      application: 2048, // 2048: VoIP | 2049: Audio | 2051: RestrictedLowDelay
      sampling_rate: sampleRate, // Hz: 8000 | 12000 | 16000 | 24000 | 48000
      frame_duration: 10 // ms: 2.5 | 5 | 10 | 20 | 40 | 60
    }
  };

  const opusHeaderPackets = await encoder.setup(encoderConfig);
  console.log("[sender] setup encoder w/", encoderConfig);

  return { encoder, opusHeaderPackets };
}

export async function runSender({ encoder, sendTransport, sampleRate, numOfChannels }) {
  console.log("[sender] run");

  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true
  });

  const audioContext = new AudioContext({ sampleRate });
  // numOfInputs: 0, nunOfOutputs: 1, channelCount: 2
  const sourceNode = audioContext.createMediaStreamSource(mediaStream);
  // 0: auto bufferSize = 1024 in Chrome, 2 input channel(default), 1 output channel(required)
  const sendNode = audioContext.createScriptProcessor(0, numOfChannels || sourceNode.channelCount, 1);
  sendNode.onaudioprocess = async ({ inputBuffer }) => {
    const N = inputBuffer.numberOfChannels;
    const buf = new Float32Array(inputBuffer.length * N);
    for (let i = 0; i < N; ++i) {
      const ch = inputBuffer.getChannelData(i);
      for (let j = 0; j < ch.length; ++j) {
        buf[j * N + i] = ch[j];
      }
    }

    // into opus
    const packets = await encoder.encode(buf);
    if (packets.length === 0) return;

    // send w/ networiking shim
    // setTimeout(() => sendTransport.send(packets), Math.random() * 10);
    sendTransport.send(`${packets.length}`);
    for (const packet of packets) {
      sendTransport.send(packet.data);
    }
  };

  sourceNode.connect(sendNode).connect(audioContext.destination);

  // setTimeout(() => {
  //   sourceNode.disconnect();
  //   sendNode.disconnect();
  // }, 1000);
}
