// TODO: refactor this
import { RingBuffer } from "./ring-buffer.js";

export class PlayerNode {
  constructor(audioContext, options = {}) {
    const numOfChannels = options.numOfChannels || 1;

    this._node = audioContext.createScriptProcessor(1024, 0, numOfChannels);
    this._node.onaudioprocess = this._onaudioprocess.bind(this);

    this._isWriting = false;
    this._isBuffering = true;
    this._isRequestingCheckBuffer = false;

    this._periodSamples = 1024 * numOfChannels;
    this._delaySamples = this._periodSamples * 4;

    this._queue = [];
    this._ringBuf = new RingBuffer(
      new Float32Array(this._periodSamples * 16)
    );
  }

  connect(dest) {
    this._node.connect(dest);
  }

  disconnect() {
    this._node.disconnect();
  }

  enqueueSamples(samples) {
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
    const buf = new Float32Array(outputBuffer.getChannelData(0).length * N);
    const size = this._ringBuf.read_some(buf) / N;
    for (let i = 0; i < N; ++i) {
      const ch = outputBuffer.getChannelData(i);
      for (let j = 0; j < size; ++j) ch[j] = buf[j * N + i];
    }

    this._checkBuffer(true);
  }

  _checkBuffer(useTimeOut) {
    if (this._isRequestingCheckBuffer) return;
    if (!this._checkBufferInternal()) return;

    if (useTimeOut) {
      this._isRequestingCheckBuffer = true;
      setTimeout(() => {
        this._isRequestingCheckBuffer = false;
        if (this._checkBufferInternal()) this._onNeedBuffer();
      }, 0);
    } else {
      this._onNeedBuffer();
    }
  }

  _checkBufferInternal() {
    if (this._isWriting) return false;

    const avail = this._ringBuf.available();
    const size = this._ringBuf.size();

    if (size >= this._delaySamples) this._isBuffering = false;
    if (this._periodSamples <= avail) return true;

    return false;
  }

  async _onNeedBuffer() {
    if (this._queue.length === 0) return;
    if (this._isWriting) return;

    const samples = this._queue.shift();

    this._isWriting = true;
    await this._ringBuf.append(samples);

    this._isWriting = false;
    this._checkBuffer(false);
  }
}
