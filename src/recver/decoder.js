export class AudioDecoder {
  constructor(path) {
    this._worker = new Worker(path);
  }

  async setup(packets) {
    const transferList = [];
    for (let i = 0; i < packets.length; ++i) {
      transferList.push(packets[i].data);
    }

    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) {
          reject(data);
          return;
        }
        resolve(data);
      };

      this._worker.postMessage(
        { config: {}, packets },
        transferList
      );
    });
  }

  async decode(packet) {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        if (data.status !== 0) {
          reject(data);
          return;
        }
        resolve(data);
      };

      this._worker.postMessage(packet, [packet.data]);
    });
  }
}
