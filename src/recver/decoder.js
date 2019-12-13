export class AudioDecoder {
  constructor(path) {
    this._worker = new Worker(path);
  }

  async setup(packets) {
    const transfer = [];
    for (let i = 0; i < packets.length; ++i) {
      transfer.push(packets[i].data);
    }

    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) return reject(data);
        resolve(data);
      };

      this._worker.postMessage({ config: {}, packets }, transfer);
    });
  }

  // buf: ArrayBuffer
  async decode(buf) {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) return reject(data);
        resolve(data);
      };

      this._worker.postMessage({ data: buf }, [buf]);
    });
  }
}
