export class RingBuffer {
  constructor(buffer) {
    this._buffer = buffer;
    this._writePos = 0;
    this._readPos = 0;
  }

  write(data) {
    if (data.length > this._buffer.length) {
      throw new Error("data size should be smaller than buffer size!");
    }

    const totalSize = Math.min(data.length, this.available());
    if (totalSize == 0) return 0;

    const pos = this._writePos % this._buffer.length;
    const size = Math.min(totalSize, this._buffer.length - pos);
    this._buffer.set(data.subarray(0, size), pos);

    // restart from index: 0
    if (size < totalSize) {
      this._buffer.set(data.subarray(size, totalSize), 0);
    }

    this._writePos += totalSize;
    return totalSize;
  }

  read(output) {
    const totalSize = Math.min(output.length, this.size());
    if (totalSize == 0) return 0;

    const pos = this._readPos % this._buffer.length;
    const size = Math.min(totalSize, this._buffer.length - pos);
    output.set(this._buffer.subarray(pos, pos + size), 0);

    // restart from index: 0
    if (size < totalSize) {
      output.set(this._buffer.subarray(0, totalSize - size), size);
    }

    this._readPos += totalSize;
    return totalSize;
  }

  clear() {
    this._writePos = 0;
    this._readPos = 0;
  }

  capacity() {
    return this._buffer.length;
  }

  size() {
    return this._writePos - this._readPos;
  }

  available() {
    return this.capacity() - this.size();
  }
}
