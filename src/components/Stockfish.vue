<template>
  <div class="analysis-container">
    <div class="header">
      <h2>Analysis</h2>
      <div class="controls">
        <button class="hide-button" @click="toggleHide">
          {{ isHidden ? 'Show' : 'Hide' }}
        </button>
        <div class="dropdown-container">
          <label for="depth">Depth: </label>
          <select id="depth" v-model="searchDepth">
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="25">25</option>
            <option value="30">30</option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="!isHidden" class="analysis-content">
      <table>
        <thead>
        <tr>
          <th>Engine</th>
          <th>Eval</th>
          <th>Moves</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="evaluation !== null && bestMoves.length">
          <td>Stockfish</td>
          <td>{{ evaluation }}</td>
          <td>{{ formattedMoves }}</td>
        </tr>
        </tbody>
      </table>
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
      searchDepth: 15, // Dubina pretrage
      isHidden: false
    };
  },
  computed: {
    formattedMoves() {
      return this.bestMoves.map(line => line.join(' ')).join(' ');
    }
  },
  methods: {
    initializeWorker() {
      if (this.worker) return; // Ako je radnik već pokrenut, ne pokreći ga ponovo
      this.worker = new Worker('/stockfish.js');
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
    analyzePosition(fen, playerToMove) {
      if (!this.isActive || fen === this.startPositionFen) return;
      this.bestMoves = [];
      this.evaluation = null;
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
      // Dodavanje informacije ko je na potezu
      const fullFen = `${fen} ${playerToMove} KQkq - 0 1`;
      this.worker.postMessage(`position fen ${fullFen}`);
      this.worker.postMessage('setoption name MultiPV value 1');
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
    toggleHide() {
      this.isHidden = !this.isHidden;
      this.toggleStockfish();
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
        const pv = match[2].trim().split(' ').slice(0, 10);
        lines.push(pv);
        if (lines.length >= 3) break;
      }
      return lines;
    }
  },
  created() {
    bus.$on('analyzePosition', (fen, playerToMove) => {
      this.analyzePosition(fen, playerToMove);
    });
  },
  mounted() {
    this.initializeWorker();
  }
};
</script>

<style scoped>
.analysis-container {
  border: 1px solid #ddd;
  border-radius: 0 0 8px 8px;
  padding: 16px;
  width: 500px;
  background-color: #f9f9f9;
  margin-left: 0;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  height: 50px; /* Adjust this value to make the header smaller */
}
.controls {
  display: flex;
  gap: 10px; /* Small gap between buttons */
  align-items: center;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
</style>
