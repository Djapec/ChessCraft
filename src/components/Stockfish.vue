<template>
  <div>
    <h1>Stockfish Engine</h1>
    <button @click="toggleStockfish">
      {{ isActive ? 'Turn off' : 'Turn on' }}
    </button>
    <div>
      <label for="depth">Choose engine depth: </label>
      <select id="depth" v-model="searchDepth">
        <option value="15">15</option>
        <option value="20">20</option>
        <option value="25">25</option>
        <option value="30">30</option>
      </select>
    </div>
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


import bus from "../bus";

export default {
  name: 'engine',
  data() {
    return {
      worker: null,
      bestMoves: [],
      evaluation: null,
      startPositionFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Početna pozicija kao primer
      isActive: true, // Dodato polje za praćenje statusa Stockfish-a
      searchDepth: 15 // Dubina pretrage
    };
  },
  methods: {
    initializeWorker() {
      if (this.worker) return; // Ako je radnik već pokrenut, ne pokreći ga ponovo
      this.worker = new Worker('stockfish.js');
      this.worker.onmessage = (event) => {
        const message = event.data;
        if (message.startsWith('info depth ' + this.searchDepth)) {
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
    terminateWorker() {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    },
    analyzePosition(fen) {
      if (!this.isActive || fen === this.startPositionFen) return;
      this.bestMoves = [];
      this.evaluation = null;
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage('setoption name MultiPV value 5');
      this.worker.postMessage(`go depth ${this.searchDepth}`);
    },
    toggleStockfish() {
      this.isActive = !this.isActive;
      if (this.isActive) {
        this.initializeWorker();
      } else {
        this.terminateWorker();
      }
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
    }
  },
  created() {
    bus.$on('analyzePosition', (fen) => {
      this.analyzePosition(fen);
    });
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
