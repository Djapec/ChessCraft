<template>
  <div v-show="isVisible" class='mosaic-view-container'>
    <mosaic-view-board v-show="parsedGames[0]?.chess" :parsed-game-data="parsedGames[0]"></mosaic-view-board>
    <mosaic-view-board v-show="parsedGames[1]?.chess" :parsed-game-data="parsedGames[1]"></mosaic-view-board>
    <mosaic-view-board v-show="parsedGames[2]?.chess" :parsed-game-data="parsedGames[2]"></mosaic-view-board>
    <mosaic-view-board v-show="parsedGames[3]?.chess" :parsed-game-data="parsedGames[3]"></mosaic-view-board>
  </div>
</template>

<script>
import MosaicViewBoard from "@/components/mosaic-view/MosaicViewBoard.vue";
import bus from "@/bus";
import {getCurrentMoveScheduledByTime, partlyClonePgn} from "../pgn/pgnParserWithDelay";

export default {
  name: 'MosaicView',
  components: { MosaicViewBoard },
  data() {
    return {
      parsedGames: [{}, {}, {}, {}],
      workers: [],
      isVisible: true,
      isLive: false,
    }
  },
  created() {
    bus.$on('generateMosaicView', (items) => {
      this.isVisible = true
      this.parsedGames = items
      if (this.isLive) {
        this.startProcessingLiveGames()
      } else {
        this.startProcessingGamesWithDelay();
      }
    });

    bus.$on('hideMosaicView', () => {
      this.hideMosaicView();
    });
  },
  beforeUnmount() {
    this.stopAllWorkers();
  },
  methods: {
    startProcessingLiveGames() {
      this.parsedGames.forEach((game, index) => {
        if (game?.chess) {
          this.updateParsedGame(game, index)
        }
      });
    },
    startProcessingGamesWithDelay() {
      this.stopAllWorkers();
      this.parsedGames.forEach((game, index) => {
        if (game?.chess) {
          this.presentGameWithDelay(game, index)
          this.startWorkerForGame(game, index);
        }
      });
    },
    presentGameWithDelay(parsedData, index) {
      const moveScheduledByTime = getCurrentMoveScheduledByTime(parsedData.halfMoves, new Date())
      if (moveScheduledByTime) {
        let partlyClonedGame = partlyClonePgn(parsedData, moveScheduledByTime.id)
        this.updateParsedGame(partlyClonedGame, index)
      }
    },
    startWorkerForGame(parsedData, gameIndex) {
      const worker = new Worker("mosaicViewWorker.js");

      worker.onmessage = (e) => {
        if (e.data.status === "complete" || e.data.status === "stopped") {
          worker.terminate();
        } else if (e.data.status === "update") {
          let partlyClonedGame = partlyClonePgn(parsedData ,e.data.moveScheduledByTime.id)
          this.updateParsedGame(partlyClonedGame, e.data.gameIndex)
        }
      };

      worker.postMessage({ gameIndex, parsedData: JSON.parse(JSON.stringify(parsedData)) });
      this.workers.push(worker);
    },
    updateParsedGame(newGameData, gameIndex) {
      this.parsedGames[gameIndex] = newGameData;
    },
    stopAllWorkers() {
      this.workers.forEach(worker => worker.terminate());
      this.workers = [];
    },
    hideMosaicView() {
      this.isVisible = false;
      this.stopAllWorkers();
    }
  }
}
</script>

<style scoped>
.mosaic-view-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-gap: 4rem;
}
</style>
