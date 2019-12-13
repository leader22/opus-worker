# opus-worker

Use OPUS to send audio w/o WebRTC.

```
// sender x 1
[ main ] getUserMedia()
         ↓ MediaStream
[ main ] MediaStreamSourceNode -> ScriptProcessorNode -(PCM)-> Encoder
         ↓ Float32Array
[worker] OpusEncoder
         ↓ ArrayBuffer
[ main ] Transport.send()

〜〜 over WebSocket or BroadcastChannel or DataChannel or ... 〜〜〜

// recver x N
[ main ] Transport.onmessage -> Decoder
         ↓ ArrayBuffer
[worker] OpusDecoder
         ↓ Float32Array
[ main ] WebAudioPlayerNode(= ScriptProcessorNode <-> RingBuffer) -> Destination
```

Codes are heavily referenced and copied from https://github.com/kazuki/opus.js-sample 
