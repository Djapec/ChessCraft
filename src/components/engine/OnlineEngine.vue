<template>
  <div class="analysis-container">
    <div class="header">
      <b>Analysis</b>
      <div class="controls">
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
        <tbody>
        <tr v-if="(evaluation === null || continuationArr.length === 0)">
          <td colspan="3" class="calculating"> ... </td>
        </tr>
        <tr v-if="evaluation !== null && continuationArr.length">
          <td>Stockfish</td>
          <td>{{ evaluation }}</td>
          <td>{{ continuationArr }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script>
import axios from 'axios';
import { ref, watch, onUnmounted } from 'vue';
import { Chess } from "../../../public/chess.min.js";
import { useGameOnTheBoardStore } from "../../store/CurrentGameStore";
import {groupMoves, replaceChessNotationWithIcons} from "../../utils/util";

/**
 * OnlineEngine Component
 *
 * This component sends chess data to an online engine API.
 * It uses a CancelToken to ensure that only the latest request is processed,
 * canceling any ongoing requests if a new one is triggered.
 */
export default {
  name: 'onlineEngine',

  props: {
    /**
     * The FEN notation string representing the chess position.
     *
     * @type {string}
     * @required
     */
    fen: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const gameOnTheBoardStore = useGameOnTheBoardStore()

    // API endpoint and axios cancel token reference
    const API_URL = 'https://chess-api.com/v1';
    let cancelTokenSource = ref(null);

    // Reactive state properties
    const error = ref(null);
    const isHidden = ref(false);
    const isLoading = ref(false);
    const evaluation = ref(null);
    const continuationArr = ref(null);
    const continuationInSanNotation = ref(null);

    /**
     * Sends a POST request to the chess API with the given FEN data.
     * Cancels any ongoing request if a new one is made.
     *
     * @async
     * @function fetchChessData
     * @param {string} fen - The FEN notation representing the chess position.
     * @returns {Promise<void>} - Resolves when the API call completes.
     */
    async function fetchChessData(fen) {
      if (cancelTokenSource.value) {
        cancelTokenSource.value.cancel('Previous request canceled due to new request.');
      }

      cancelTokenSource.value = axios.CancelToken.source();

      error.value = null;
      isLoading.value = true;
      evaluation.value = null;
      continuationArr.value =null;
      continuationInSanNotation.value = null;

      try {
        const response = await axios.post(API_URL, { fen, depth: 15 }, {
          cancelToken: cancelTokenSource.value.token,
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.data?.eval && response.data?.continuationArr && response.data?.move) {
          const { eval: evaluationValue, continuationArr: rawContinuationArr, move, turn } = response.data;

          evaluation.value = evaluationValue;
          const formatedContinuationLine =
              formatMovesToFigureNotation(formatMovesToSanNotation([move, ...rawContinuationArr].slice(0, 5)))

          const currentMovesNumber = Math.round(gameOnTheBoardStore.getChessHistoryForEngineAnalyze.length / 2)
          continuationArr.value = groupMoves(formatedContinuationLine, currentMovesNumber, turn)
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Request canceled:', err.message);
        } else {
          error.value = 'An error occurred while fetching data.';
          console.error('API Error:', err);
        }
      } finally {
        isLoading.value = false;
      }
    }

    function formatMovesToSanNotation(moveLine) {
      let chess = new Chess();
      const validSanMoves = [];

      const currentGameHistory = gameOnTheBoardStore.getChessHistoryForEngineAnalyze;

      for (let i = 0; i < currentGameHistory.length; i++) {
        let move = currentGameHistory[i];
        chess.move(move);
      }

      for (const move of moveLine) {
        let moveInSanFormat = chess.move({from: move.substring(0, 2), to: move.substring(2, 4)})
        if (moveInSanFormat)
          validSanMoves.push(moveInSanFormat.san);
      }

      return validSanMoves
    }

    function formatMovesToFigureNotation(moves) {
      return moves.map(line =>
          replaceChessNotationWithIcons(line)).join(' ');
    }

    function toggleHide() {
      this.isHidden = !this.isHidden;
    }

    /**
     * Watches for changes in the `fen` prop and triggers `fetchChessData`
     * to fetch new data whenever the `fen` prop changes.
     */
    watch(() => props.fen, (newFen) => {
      if (newFen && gameOnTheBoardStore.getCurrentGameOnTheBoard.chess) {
        fetchChessData(newFen);
      }
    });

    /**
     * Cleans up any ongoing requests by canceling them when the component is unmounted.
     */
    onUnmounted(() => {
      if (cancelTokenSource.value) {
        cancelTokenSource.value.cancel('Component unmounted, request canceled.');
      }
    });

    return {
      toggleHide,
      isHidden,
      gameOnTheBoardStore,
      isLoading,
      error,
      evaluation,
      continuationArr
    };
  },
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