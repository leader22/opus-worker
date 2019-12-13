import { RingBuffer } from "./ring-buffer.js";

export class PlayerNode {
  constructor(audioContext, options = {}) {
    const numOfChannels = options.numOfChannels || 2;
    const delayUnit = options.delayUnit || 4;

    this._node = audioContext.createScriptProcessor(
      0,
      0,
      numOfChannels
    );
    this._node.onaudioprocess = this._onaudioprocess.bind(this);

    this._isStarted = false;
    // if false, just wait until buffered
    this._canDequeue = false;

    const periodSamples = this._node.bufferSize * numOfChannels;
    this._delaySamples = periodSamples * delayUnit;
    // allocate 2x large buffer to be sure
    this._ringBuf = new RingBuffer(new Float32Array(this._delaySamples * 2));
  }

  connect(dest) {
    this._node.connect(dest);
    return dest;
  }
  disconnect() {
    this._node.disconnect();
  }
  start() {
    this._isStarted = true;
  }
  stop() {
    this._isStarted = false;
    this._canDequeue = false;
    this._ringBuf.clear();
  }

  enqueue(samples) {
    if (!this._isStarted) return;

    this._ringBuf.write(samples);
    // samples in buffer is larger than delay
    this._canDequeue = this._delaySamples <= this._ringBuf.size();
  }

  getBufferStatus() {
    return {
      size: this._ringBuf.size(),
      available: this._ringBuf.available(),
      capacity: this._ringBuf.capacity()
    };
  }

  _onaudioprocess({ outputBuffer }) {
    if (!this._isStarted) return;
    if (!this._canDequeue) return;

    const N = outputBuffer.numberOfChannels;
    const buf = new Float32Array(outputBuffer.length * N);
    const size = this._ringBuf.read(buf) / N;

    for (let i = 0; i < N; ++i) {
      const ch = outputBuffer.getChannelData(i);
      for (let j = 0; j < size; ++j) {
        ch[j] = buf[j * N + i];
      }
    }
  }
}
