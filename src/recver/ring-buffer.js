export class RingBuffer {
  constructor(buffer) {
    this._buffer = buffer;
    this._writePos = 0;
    this._readPos = 0;
    this._remainingWriteData = null;
  }

  async append(data) {
    return new Promise((resolve, reject) => {
      // 書き込み処理が実施中の場合は常にrejectする
      if (this._remainingWriteData)
        return reject();

      const size = this._appendSome(data);
      if (size == data.length)
        return resolve();

      // 空き容量がないので，読み込み処理が実施時に書き込むようにする
      this._remainingWriteData = [data.subarray(size), resolve];
    });
  }

  readSome(output) {
    let ret = this._readSome(output);

    if (this._remainingWriteData) {
      this._appendRemainingData();

      if (ret < output.length) {
        ret += this._readSome(output.subarray(ret));
      }
    }

    return ret;
  }

  clear() {
    this._writePos = 0;
    this._readPos = 0;
    this._remainingWriteData = null;
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

  _appendSome(data) {
    const totalSize = Math.min(data.length, this.available());
    if (totalSize == 0) return 0;

    // 書き込み位置からバッファの終端まで書き込む
    const pos = this._writePos % this._buffer.length;
    const size = Math.min(totalSize, this._buffer.length - pos);
    this._buffer.set(data.subarray(0, size), pos);

    // バッファの終端に達したが，書き込むデータがまだあるため
    // バッファの先頭から書き込みを継続する
    if (size < totalSize) {
      this._buffer.set(data.subarray(size, totalSize), 0);
    }

    this._writePos += totalSize;
    return totalSize;
  }

  _appendRemainingData() {
    const [data, resolve] = this._remainingWriteData;
    this._remainingWriteData = null;

    const size = this._appendSome(data);
    if (size == data.length)
      return resolve();

    this._remainingWriteData = [data.subarray(size), resolve];
  }

  _readSome(output) {
    const totalSize = Math.min(output.length, this.size());
    if (totalSize == 0) return 0;

    // 読み込み位置からバッファ終端方向に読み込む
    const pos = this._readPos % this._buffer.length;
    const size = Math.min(totalSize, this._buffer.length - pos);
    output.set(this._buffer.subarray(pos, pos + size), 0);

    // バッファの終端に達したが読み込むデータがまだあるため
    // バッファの先頭から読み込みを継続する
    if (size < totalSize) {
      output.set(this._buffer.subarray(0, totalSize - size), size);
    }

    this._readPos += totalSize;
    return totalSize;
  }
}
