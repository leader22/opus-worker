export class AudioEncoder {
  constructor(path) {
    this._worker = new Worker(path);
  }

  async setup(config) {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) return reject(data);
        resolve(data.packets);
      };

      this._worker.postMessage(config);
    });
  }

  // samples: Float32Array
  async encode(samples) {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) return reject(data);
        resolve(data.packets);
      };

      this._worker.postMessage(
        {
          samples,
          timestamp: Date.now(),
          transferable: true
        },
        [samples.buffer]
      );
    });
  }
}
