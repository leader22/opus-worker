import { RingBuffer } from "./ring-buffer.js";

export class PlayerNode {
  constructor(audioContext, options = {}) {
    const sampleSize = options.sampleSize || 1024;
    const numOfChannels = options.numOfChannels || 1;
    const delayUnit = options.delayUnit || 4;

    this._node = audioContext.createScriptProcessor(
      sampleSize,
      0,
      numOfChannels
    );
    this._node.onaudioprocess = this._onaudioprocess.bind(this);

    this._isWriting = false;
    this._isBuffering = true;
    this._isRequestingCheckBuffer = false;

    this._periodSamples = sampleSize * numOfChannels;
    this._delaySamples = this._periodSamples * delayUnit;

    // for playing
    this._ringBuf = new RingBuffer(new Float32Array(this._delaySamples * 2));
    // for storing
    this._queue = [];
  }

  connect(dest) {
    this._node.connect(dest);
  }

  disconnect() {
    this._node.disconnect();
  }

  enqueue(samples) {
    this._queue.push(samples);
  }

  // TODO: really needed?
  close() {
    this._ringBuf.clear();
    this._isBuffering = true;
    this._node = null;
  }

  getBufferStatus() {
    return {
      size: this._ringBuf.size(),
      available: this._ringBuf.available(),
      capacity: this._ringBuf.capacity()
    };
  }

  _onaudioprocess({ outputBuffer }) {
    if (this._isBuffering) {
      this._checkBuffer(false);
      return;
    }

    const N = outputBuffer.numberOfChannels;
    const buf = new Float32Array(outputBuffer.length * N);
    const size = this._ringBuf.read(buf) / N;

    for (let i = 0; i < N; ++i) {
      const ch = outputBuffer.getChannelData(i);
      for (let j = 0; j < size; ++j) {
        ch[j] = buf[j * N + i];
      }
    }

    this._checkBuffer(true);
  }

  _checkBuffer(useTimeOut) {
    if (this._isRequestingCheckBuffer) return;
    if (!this._checkBufferInternal()) return;

    if (!useTimeOut) {
      this._onNeedBuffer();
      return;
    }

    this._isRequestingCheckBuffer = true;
    setTimeout(() => {
      this._isRequestingCheckBuffer = false;
      this._checkBufferInternal() && this._onNeedBuffer();
    }, 0);
  }

  _checkBufferInternal() {
    if (this._isWriting) return false;

    const size = this._ringBuf.size();
    if (this._delaySamples <= size) {
      this._isBuffering = false;
    }

    const available = this._ringBuf.available();
    if (this._periodSamples <= available) return true;

    return false;
  }

  async _onNeedBuffer() {
    if (this._queue.length === 0) return;
    if (this._isWriting) return;

    this._isWriting = true;
    const samples = this._queue.shift();
    await this._ringBuf.write(samples);
    this._isWriting = false;

    this._checkBuffer(false);
  }
}
