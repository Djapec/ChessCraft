<template>
  <div class="analysis-container">
    <div class="header">
      <b>Analysis</b>
      <div class="controls">
<!--        <div class="dropdown-container">-->
<!--          <label for="depth">Depth:</label>-->
<!--          <select id="depth" class="depth-selector" v-model="searchDepth">-->
<!--            <option value="15">15</option>-->
<!--            <option value="20">20</option>-->
<!--            <option value="25">25</option>-->
<!--            <option value="30">30</option>-->
<!--          </select>-->
<!--        </div>-->
        <div class="toggle-container">
          <label class="switch">
            <input type="checkbox" @click="toggleHide" :checked="!isHidden">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">Hide</span>
        </div>
      </div>
    </div>
    <div v-if="!isHidden" class="analysis-content">
      <table>
        <thead>
        <tr>
          <th>Engine</th>
          <th>Evaluation</th>
          <th>Moves</th>
        </tr>
        </thead>
        <tbody v-if="(this.currentGameHistory)">
        <tr v-if="isActive && (evaluation === null || bestMoves.length === 0)">
          <td colspan="3" class="calculating">
            {{this.engineMessage}}
            <span class="dot-flashing"></span>
          </td>
        </tr>
        <tr v-if="evaluation !== null && bestMoves.length">
          <td>Stockfish</td>
          <td>{{ handleEvaluationString(evaluation, apiScore) }}</td>
          <td>{{ groupMoves(formattedMoves, this.currentMovesNumber, this.playerToMove) }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import bus from "../../bus";
import { Chess } from "../../../public/chess.min.js";
import {
  getPreviousMoveFenPosition,
  getStockfishEvaluation,
  groupMoves, handleEvaluationString,
  replaceChessNotationWithIcons
} from "../../utils/util"; // version 0.13.4

export default {
  name: 'engine',
  data() {
    return {
      worker: null,
      bestMoves: [],
      evaluation: null,
      startPositionFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      isActive: true,
      searchDepth: 15,
      isHidden: false,
      currentGameHistory: null,
      currentMovesNumber: 0,
      playerToMove: '',
      engineMessage: '...',
      apiScore: 0,
    };
  },
  computed: {
    formattedMoves() {
      return this.bestMoves.map(line =>
          replaceChessNotationWithIcons(this.formatMovesToSanNotation(line).join(' '))).join(' ');
    }
  },
  methods: {
    handleEvaluationString,
    groupMoves,
    initializeWorker() {
      if (this.worker) return;
      this.worker = new Worker('/stockfish.js');
      this.worker.onmessage = (event) => {
          const message = event.data;
          if (message.includes('mate')) {
            const evalMatch = this.parseEvaluation(message);
            if (evalMatch && evalMatch === 'Checkmate') {
              //this.engineMessage = 'Checkmate!'
            }

            if (evalMatch) {
              this.evaluation = evalMatch;
            }
          } else if (message.includes('depth')) {
            const evalMatch = this.parseEvaluation(message);
            if (evalMatch) {
              this.evaluation = evalMatch;
            }
          }

          const lines = this.parseBestMoves(message);
          if (lines.length) {
            this.bestMoves = lines;
          }
        }
    },
    terminateWorker() {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    },
    async analyzePosition(fen, playerToMove, gameHistory) {
      if (!this.isActive || fen === this.startPositionFen) return;
      this.currentGameHistory = gameHistory;
      this.currentMovesNumber = Math.round(gameHistory.length / 2)
      this.playerToMove = playerToMove;
      this.bestMoves = [];
      this.evaluation = null;
      //this.engineMessage = 'Calculating...';
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
      const fullFen = `${fen} ${playerToMove} KQkq - 0 1`;

      this.apiScore = await getStockfishEvaluation(fen, 12);

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
          return (scoreValue / 100).toFixed(2);
        } else if (scoreType === 'mate') {

          if (scoreValue === 0) {
            return 'Checkmate';
          }

          return `Mate in ${Math.abs(scoreValue)}`;
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
    },
    formatMovesToSanNotation(moveLine) {
      let chess = new Chess();
      const validSanMoves = [];

      for (let i = 0; i < this.currentGameHistory.length; i++) {
        let move = this.currentGameHistory[i];
        chess.move(move);
      }

      for (const move of moveLine) {
        let moveInSanFormat = chess.move({from: move.substring(0, 2), to: move.substring(2, 4)})
        if (moveInSanFormat)
          validSanMoves.push(moveInSanFormat.san);
      }

      return validSanMoves
    }
  },
  created() {
    bus.$on('analyzePosition', (fen, playerToMove, gameHistory) => {
      this.analyzePosition(fen, playerToMove, gameHistory);
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
  border-radius: 8px;
  background-color: #f8f8f8;
  width: 500px;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media screen and (max-width: 600px) {
    width: 340px;
  }
}

.header {
  background-color: #f8f8f8;
  padding: 1px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  height: 50px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.dropdown-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #fff;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
}

.calculating {
  text-align: center;
  color: #666;
  font-style: italic;
}

.dot-flashing {
  position: relative;
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background-color: #666;
  color: #666;
  animation: dotFlashing 1s infinite linear alternate;
  animation-delay: .5s;
  margin-left: 5px;
}

@keyframes dotFlashing {
  0% {
    background-color: #666;
  }
  50%,
  100% {
    background-color: #f7f7f7;
  }
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: #2196F3;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #fff;
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.toggle-label {
  font-size: 16px;
  color: #333;
  margin-left: 5px;
}

.depth-selector{
  padding: 5px;
  width: 60px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  color: #333;
  cursor: pointer;
}
</style>
