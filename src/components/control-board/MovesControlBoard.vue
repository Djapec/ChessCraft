<template>
  <div class="move-list-container">
    <div class="move-controls">
      <button class="button" @click="loadFirstMove()" :disabled="isButtonsDisabled">&#171;</button>
      <button class="button" id="prevMove" @click="loadPrevMove()" :disabled="isButtonsDisabled">&#8249;</button>
      <button class="button undo-button" @click="undo()" :disabled="!isButtonsDisabled">&#8635;</button>
      <button class="button" id="nextMove" @click="loadNextMove()" :disabled="isButtonsDisabled">&#8250;</button>
      <button class="button" @click="loadLastMove()" :disabled="isButtonsDisabled">&#187;</button>
    </div>
    <div class="move-list">
      <table>
        <tbody>
          <tr v-for="(move, index) in movePairs" :key="index">
            <td>{{ index + 1 }}.</td>
            <td
                v-if="move.white"
                :class="{ active: isActiveMove(move.white) }"
                class="move-notation"
                @click="logMove(move.white)"
            >
              {{ replaceChessNotationWithIcons(move.white.move) }}
            </td>
            <td
                v-if="move.black"
                :class="{ active: isActiveMove(move.black) }"
                class="move-notation"
                @click="logMove(move.black)"
            >
              {{ replaceChessNotationWithIcons(move.black.move) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="header">
      <span>Enable movement</span>
      <label class="switch">
        <input type="checkbox" v-model="isViewOnlyMod" @change="toggleMovement">
        <span class="slider round"></span>
      </label>
    </div>
  </div>
</template>

<script>
import bus from "../../bus";
import {replaceChessNotationWithIcons} from "../pgn/utils/util";

export default {
  name: "movesControlBoard",
  data() {
    return {
      isViewOnlyMod: false,
      isButtonsDisabled: false,
      currentMoveIndex: 1,
      parsedPgnGameData: {
        halfMoves: []
      }
    }
  },
  computed: {
    movePairs() {
      const pairs = [];
      for (let i = 0; i < this.parsedPgnGameData.halfMoves.length; i += 2) {
        pairs.push({
          white: this.parsedPgnGameData.halfMoves[i].color === 'white' ? this.parsedPgnGameData.halfMoves[i] : null,
          black: this.parsedPgnGameData.halfMoves[i + 1] &&
          this.parsedPgnGameData.halfMoves[i + 1].color === 'black' ? this.parsedPgnGameData.halfMoves[i + 1] : null
        });
      }
      return pairs;
    }
  },
  methods: {
    replaceChessNotationWithIcons,

    /**
     * Checks if the given move is the active move and scrolls to it.
     * @param {Object} move - The move object to check.
     * @returns {boolean} - True if the move is the active move, false otherwise.
     */
    isActiveMove(move) {
      this.scrollToActiveMove();
      return this.currentMoveIndex === move.id;
    },

    /**
     * Toggles the movement state and emits an event to update the movement mode.
     */
    toggleMovement() {
      this.isButtonsDisabled = !this.isButtonsDisabled;
      bus.$emit('toggleMovement', !this.isViewOnlyMod);
    },

    /**
     * Logs a move by emitting an event if not in view-only mode.
     * @param {Object} move - The move to log.
     */
    logMove(move) {
      if (!this.isViewOnlyMod)
        bus.$emit('loadRandomMove', move);
    },

    /**
     * Emits an event to load the first move in the game.
     */
    loadFirstMove() {
      bus.$emit('firstMove');
    },

    /**
     * Emits an event to load the previous move in the game.
     */
    loadPrevMove() {
      bus.$emit('prevMove');
    },

    /**
     * Emits an event to load the next move in the game.
     */
    loadNextMove() {
      bus.$emit('nextMove');
    },

    /**
     * Emits an event to load the last move in the game.
     */
    loadLastMove() {
      bus.$emit('lastMove');
    },

    /**
     * Emits an event to undo the last move.
     */
    undo() {
      bus.$emit('undo');
    },

    /**
     * Loads the game move list from the parsed PGN data and scrolls to the active move.
     * @param {Object} parsedPgnData - The parsed PGN data containing the move list.
     */
    loadGameMoveList(parsedPgnData) {
      this.parsedPgnGameData = parsedPgnData;
      this.scrollToActiveMove();
    },

    /**
     * Scrolls the move list to center the active move within the view.
     */
    scrollToActiveMove() {
      this.$nextTick(() => {
        const activeMove = this.$el.querySelector('.active');
        if (activeMove) {
          this.centerActiveMoveInView(activeMove);
        }
      });
    },

    /**
     * Centers the given move element in the move list view.
     * @param {Element} activeMove - The DOM element representing the active move.
     */
    centerActiveMoveInView(activeMove) {
      const moveList = this.$el.querySelector('.move-list');
      const moveListRect = moveList.getBoundingClientRect();
      const activeMoveRect = activeMove.getBoundingClientRect();
      moveList.scrollTop += activeMoveRect.top - moveListRect.top - moveListRect.height / 2 + activeMoveRect.height / 2;
    },
  },
  created() {
    bus.$on('updateCurrentMove', (moveIndex) => {
      this.currentMoveIndex = moveIndex;
    });

    bus.$on('loadGameMoveList', (parsedPgnData) => {
      this.loadGameMoveList(parsedPgnData);
    });

    bus.$on('disableMovementAndControlsWhenChangingGame', () => {
      this.isViewOnlyMod = false;
      this.isButtonsDisabled = false;
      bus.$emit('toggleMovement', !this.isViewOnlyMod);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' && !this.isButtonsDisabled) {
        this.loadNextMove();
      }
      if (event.key === 'ArrowLeft' && !this.isButtonsDisabled) {
        this.loadPrevMove();
      }
    });
  }
};
</script>

<style scoped>
.move-list-container {
  border: 1px solid #ddd;
  height: 100%;
  background-color: #f8f8f8;
  margin-left: 0;
  border-radius: 8px 8px 8px 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media screen and (max-width: 600px) {
  .move-list-container {
    width: 340px;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  align-items: center;
  margin-bottom: 8px;
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
  transition: 0.4s;
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
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #fff;
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.move-list {
  max-height: 160px;
  overflow-y: auto;
  margin-bottom: 8px;
}

table {
  background-color: #fff;
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  font-size: 18px;
  padding: 8px;
  border-bottom: 1px solid #ddd;

  &:hover.move-notation {
    cursor: pointer;
  }
}

.move-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
}

@media screen and (max-width: 600px) {
  .move-controls {
    width: 340px;
    gap: 5px;
  }
}

.move-controls button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 25px;
  margin: 0 20px;
}

.active {
  background-color: #f1f3f4;
  transition: background-color 0.3s ease;
}

.undo-button {
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
}

.undo-button:enabled {
  color: #2196F3;
}
</style>