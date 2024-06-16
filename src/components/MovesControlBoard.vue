<template>
  <div class="move-list-container">
    <div class="header">
      <span>Enable movements</span>
      <label class="switch">
        <input type="checkbox" v-model="isViewOnlyMod" @change="toggleMovement">
        <span class="slider round"></span>
      </label>
    </div>
    <div class="move-list">
      <table>
        <thead>
        <tr>
          <th></th>
          <th></th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(move, index) in movePairs" :key="index">
          <td>{{ index + 1 }}.</td>
          <td @click="logMove(move.white)" v-if="move.white">{{ move.white.move }}</td>
          <td @click="logMove(move.black)" v-if="move.black">{{ move.black.move }}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="move-controls">
      <button @click="loadFirstMove()" :disabled="!isButtonsDisabled">&#171;</button>
      <button @click="loadPrevMove()" :disabled="!isButtonsDisabled">&#8249;</button>
      <button>&#9654;</button>
<!--      <button class="button is-light" @click="undo()" :disabled="!isButtonsDisabled">UNDO</button>-->
      <button @click="loadNextMove()" :disabled="!isButtonsDisabled">&#8250;</button>
      <button @click="loadLastMove()" :disabled="!isButtonsDisabled">&#187;</button>
    </div>
  </div>
</template>

<script>
import bus from "../bus";

export default {
  name: "movesControlBoard",
  data() {
    return {
      isViewOnlyMod: true,
      isButtonsDisabled: false,
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
    toggleMovement() {
      this.isButtonsDisabled = !this.isButtonsDisabled;
      bus.$emit('toggleMovement', this.isViewOnlyMod);
    },
    logMove(move) {
      console.log(move);
    },
    loadFirstMove() {
      bus.$emit('firstMove');
    },
    loadPrevMove() {
      bus.$emit('prevMove');
    },
    loadNextMove() {
      bus.$emit('nextMove');
    },
    loadLastMove() {
      bus.$emit('lastMove');
    },
    loadGameMoveList(currentMoveHistory, parsedPgnData) {
      this.parsedPgnGameData = parsedPgnData;
      this.currentGameMoveHistory = currentMoveHistory;
      console.log(this.currentGameMoveHistory);
    }
  },
  created() {
    this.currentGameMoveHistory = [];

    bus.$on('loadGameMoveList', (currentMoveHistory, parsedPgnData) => {
      this.loadGameMoveList(currentMoveHistory, parsedPgnData);
    });
  }
};
</script>

<style scoped>
.move-list-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
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
  background-color: #ccc;
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
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.move-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid #ddd;
}

.move-controls {
  display: flex;
  justify-content: center;
  gap: 8px; /* Ovdje dodajemo razmak između dugmića */
}

.move-controls button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  margin: 0 20px; /* Ovdje dodajemo horizontalni razmak između dugmića */
}
</style>
