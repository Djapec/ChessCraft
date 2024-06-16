<template>
  <div class="moves-control-board-buttons">
    <button class="button is-light" @click="undo()" :disabled="!isButtonsDisabled">UNDO</button>
    <button class="button is-light" @click="loadFirstMove()" :disabled="isButtonsDisabled">first move</button>
    <button class="button is-light" @click="loadPrevMove()" :disabled="isButtonsDisabled">prev move</button>
    <button class="button is-light" @click="loadNextMove()" :disabled="isButtonsDisabled">next move</button>
    <button class="button is-light" @click="loadLastMove()" :disabled="isButtonsDisabled">last move</button>
    <button @click="toggleMovement()">{{ isViewOnlyMod ? 'Enable' : 'Disable' }} Movement</button>
  </div>

  <div class="moves-control-board-history">

  </div>
</template>

<script>
import bus from "../bus";

export default {
  name: "movesControlBoard",
  data() {
    return{
      isViewOnlyMod: true,
      isButtonsDisabled: false,
    }
  },
  methods: {
    toggleMovement() {
      this.isViewOnlyMod = !this.isViewOnlyMod;
      this.isButtonsDisabled = !this.isButtonsDisabled;
      bus.$emit('toggleMovement', this.isViewOnlyMod);
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
    undo() {
      bus.$emit('undo');
    },
    loadGameMoveList(currentMoveHistory, parsedPgnData) {
      this.currentGameMoveHistory = currentMoveHistory;
      this.parsedPgnGameData = parsedPgnData;
    }
  },
  created() {
    this.currentGameMoveHistory = [];
    this.parsedPgnGameData = null;

    bus.$on('loadGameMoveList', (currentMoveHistory, parsedPgnData) => {
      this.loadGameMoveList(currentMoveHistory, parsedPgnData)
    })
  }
}
</script>

<style scoped>

</style>