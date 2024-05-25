<template>
  <div>
    <h1>Stockfish Engine</h1>
    <input v-model="fen" placeholder="Enter FEN" />
    <button @click="analyzePosition">Analyze Position</button>
    <div v-if="bestMove">
      <h2>Best Move</h2>
      <pre>{{ bestMove }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'engine',
  data() {
    return {
      worker: null,
      bestMove: null,
      fen: 'r4rk1/pp1b3p/6p1/8/3NpP2/1P4P1/P2K3P/R6R w - - 0 22' // Početna pozicija kao primer
    };
  },
  methods: {
    initializeWorker() {
      this.worker = new Worker('stockfish.js');
      this.worker.onmessage = (event) => {
        const message = event.data;
        if (message.startsWith('bestmove')) {
          this.bestMove = message.split(' ')[1];
        }
      };
    },
    analyzePosition() {
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
      this.worker.postMessage(`position fen ${this.fen}`);
      this.worker.postMessage('go depth 15');
    }
  },
  mounted() {
    this.initializeWorker();
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
