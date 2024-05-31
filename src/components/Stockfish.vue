<template>
  <div>
    <h1>Stockfish Engine</h1>
    <input v-model="fen" placeholder="Enter FEN" />
    <button @click="analyzePosition">Analyze Position</button>
    <div v-if="evaluation !== null">
      <h2>Evaluation</h2>
      <p>{{ evaluation }}</p>
    </div>
    <div v-if="bestMoves.length">
      <h2>Best Moves</h2>
      <ul>
        <li v-for="(line, index) in bestMoves" :key="index">
          Line {{ index + 1 }}: {{ line.join(' ') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'engine',
  data() {
    return {
      worker: null,
      bestMoves: [],
      evaluation: null,
      fen: 'r4rk1/pp1b3p/6p1/8/3NpP2/1P4P1/P2K3P/R6R w - - 0 22' // Početna pozicija kao primer
    };
  },
  methods: {
    initializeWorker() {
      this.worker = new Worker('stockfish.js');
      this.worker.onmessage = (event) => {
        const message = event.data;
        if (message.startsWith('info depth 15')) {
          const evalMatch = this.parseEvaluation(message);
          if (evalMatch) {
            this.evaluation = evalMatch;
          }
          const lines = this.parseBestMoves(message);
          if (lines.length) {
            this.bestMoves = lines;
          }
        }
      };
    },
    parseEvaluation(message) {
      const evalRegex = /score (\w+) (-?\d+)/;
      const match = evalRegex.exec(message);
      if (match) {
        const scoreType = match[1];
        const scoreValue = parseInt(match[2], 10);
        if (scoreType === 'cp') {
          return (scoreValue / 100).toFixed(2); // Centipawns to pawns
        } else if (scoreType === 'mate') {
          return `Mate in ${scoreValue}`;
        }
      }
      return null;
    },
    parseBestMoves(message) {
      const regex = /multipv (\d+) .+? pv ([\w\s]+)/g;
      let match;
      const lines = [];

      while ((match = regex.exec(message)) !== null) {
        const pv = match[2].trim().split(' ');
        lines.push(pv);
        if (lines.length >= 10) break; // Uzmi samo 10 najboljih varijanti
      }
      return lines;
    },
    analyzePosition() {
      this.bestMoves = [];
      this.evaluation = null;
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
      this.worker.postMessage(`position fen ${this.fen}`);
      this.worker.postMessage('setoption name MultiPV value 5');
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
