export class AudioEncoder {
  constructor(path) {
    this._worker = new Worker(path);
  }

  async setup(config) {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) {
          reject(data);
          return;
        }
        resolve(data.packets);
      };

      this._worker.postMessage(config);
    });
  }

  async encode(samples) {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) {
          reject(data);
          return;
        }

        resolve(data.packets);
      };

      this._worker.postMessage({
        samples,
        timestamp: 0,
        transferable: true
      });
    });
  }
}
