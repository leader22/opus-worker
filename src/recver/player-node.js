import { RingBuffer } from "./ring-buffer.js";

export class PlayerNode {
  constructor(audioContext) {
    const num_of_channels = 1;
    this.context = audioContext;

    this.node = this.context.createScriptProcessor(
      1024,
      0,
      num_of_channels
    );
    this.node.onaudioprocess = this._onaudioprocess.bind(this);

    this.in_writing = false;
    this.buffering = true;
    this.in_requesting_check_buffer = false;

    this.ringbuf = null;
    this.period_samples = 1024 * num_of_channels;
    this.delay_samples = this.period_samples * 4;

    this.ringbuf = new RingBuffer(
      new Float32Array(this.period_samples * 16)
    );
  }

  onneedbuffer() {
    throw new Error("should be override");
  }

  enqueue(data) {
    return new Promise((resolve, reject) => {
      if (this.in_writing) {
        reject();
        return;
      }

      this.in_writing = true;
      this.ringbuf.append(data).then(
        () => {
          this.in_writing = false;
          this.check_buffer(false);
        },
        e => {
          this.in_writing = false;
          reject(e);
        }
      );
    });
  }

  _onaudioprocess({ outputBuffer }) {
    if (this.buffering) {
      this.check_buffer(false);
      return;
    }

    const N = outputBuffer.numberOfChannels;
    const buf = new Float32Array(outputBuffer.getChannelData(0).length * N);
    const size = this.ringbuf.read_some(buf) / N;
    for (let i = 0; i < N; ++i) {
      const ch = outputBuffer.getChannelData(i);
      for (let j = 0; j < size; ++j) ch[j] = buf[j * N + i];
    }

    this.check_buffer(true);
  }

  check_buffer(useTimeOut) {
    if (this.in_requesting_check_buffer) return;

    const needbuf = this.check_buffer_internal();
    if (!needbuf) return;

    if (useTimeOut) {
      this.in_requesting_check_buffer = true;
      window.setTimeout(() => {
        this.in_requesting_check_buffer = false;
        if (this.check_buffer_internal()) this.onneedbuffer();
      }, 0);
    } else {
      this.onneedbuffer();
    }
  }

  check_buffer_internal() {
    if (this.in_writing) return false;

    const avail = this.ringbuf.available();
    const size = this.ringbuf.size();

    if (size >= this.delay_samples) this.buffering = false;
    if (this.period_samples <= avail) return true;

    return false;
  }

  connect(dest) {
    this.node.connect(dest);
  }

  close() {
    if (this.node) {
      this.ringbuf.clear();
      this.buffering = true;
      this.node.disconnect();
    }
    this.context = null;
    this.node = null;
  }

  getBufferStatus() {
    return {
      delay: this.ringbuf.size(),
      available: this.ringbuf.available(),
      capacity: this.ringbuf.capacity()
    };
  }
}
