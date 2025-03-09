<template>
  <div v-show="isVisible" class='mosaic-view-container'>
    <mosaic-view-board v-show="mosaicViewChessGames[0]?.chess" :parsed-game-data="mosaicViewChessGames[0]"></mosaic-view-board>
    <mosaic-view-board v-show="mosaicViewChessGames[1]?.chess" :parsed-game-data="mosaicViewChessGames[1]"></mosaic-view-board>
    <mosaic-view-board v-show="mosaicViewChessGames[2]?.chess" :parsed-game-data="mosaicViewChessGames[2]"></mosaic-view-board>
    <mosaic-view-board v-show="mosaicViewChessGames[3]?.chess" :parsed-game-data="mosaicViewChessGames[3]"></mosaic-view-board>
  </div>
</template>

<script>
import MosaicViewBoard from "@/components/mosaic-view/MosaicViewBoard.vue";
import bus from "@/bus";
import {getCurrentMoveScheduledByTime, partlyClonePgn} from "../../utils/util";

export default {
  name: 'mosaicView',
  components: { MosaicViewBoard },
  inject: ['config'],
  data() {
    return {
      mosaicViewChessGames: [{}, {}, {}, {}],
      workers: [],
      isVisible: true,
      isLive: false,
    }
  },
  created() {
    this.isLive = this.config.isLive;

    bus.$on('generateMosaicView', (chessGames) => {
      this.isVisible = true
      this.mosaicViewChessGames = chessGames
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
    /**
     * Processing games live
     */
    startProcessingLiveGames() {
      this.mosaicViewChessGames.forEach((game, index) => {
        if (game?.chess) {
          this.setNewGameToMosaicViewChessGameList(game, index)
        }
      });
    },

    /**
     * Processing games with a certain delay
     */
    startProcessingGamesWithDelay() {
      this.stopAllWorkers();
      this.mosaicViewChessGames.forEach((game, index) => {
        if (game?.chess) {
          this.scrapeGameWithDelayedMoveForMosaicView(game, index)
          this.startWorkerForGame(game, index);
        }
      });
    },

    /**
     * Scraping chess game by a certain move calculated with a delay and add game to mosaic view
     * @param {Object} parsedData - The parsed game data.
     * @param {number} index - The index of the game for tracking within the mosaic view.
     */
    scrapeGameWithDelayedMoveForMosaicView(parsedData, index) {
      const moveScheduledByTime = getCurrentMoveScheduledByTime(parsedData.halfMoves, new Date())
      if (moveScheduledByTime) {
        let partlyClonedGame = partlyClonePgn(parsedData, moveScheduledByTime.id)
        this.setNewGameToMosaicViewChessGameList(partlyClonedGame, index)
      }
    },

    /**
     * Starts a web worker for processing a game and handles its messages. Update game based on delay
     * @param {Object} parsedData - The parsed game data.
     * @param {number} gameIndex - The index of the game for tracking within the mosaic view.
     */
    startWorkerForGame(parsedData, gameIndex) {
      const worker = new Worker("/mosaicViewWorker.js");

      worker.onmessage = (e) => {
        if (e.data.status === "complete" || e.data.status === "stopped") {
          worker.terminate();
        } else if (e.data.status === "update") {
          let partlyClonedGame = partlyClonePgn(parsedData ,e.data.moveScheduledByTime.id)
          this.setNewGameToMosaicViewChessGameList(partlyClonedGame, e.data.gameIndex)
        }
      };

      worker.postMessage({ gameIndex, parsedData: JSON.parse(JSON.stringify(parsedData)) });
      this.workers.push(worker);
    },

    /**
     * Set new game to mosaic view by updating parsedGames list
     * @param {object} newGameData - A new chess game will be added to the parsedGames list.
     * @param {int} gameIndex - Indicating the position of chess game inside parsedGames list.
     */
    setNewGameToMosaicViewChessGameList(newGameData, gameIndex) {
      this.mosaicViewChessGames[gameIndex] = newGameData;
    },

    /**
     * Stop all execution in the workers threads as soon as possible
     */
    stopAllWorkers() {
      this.workers.forEach(worker => worker.terminate());
      this.workers = [];
    },

    /**
     * Toggle visibility of the mosaic view component
     */
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
  grid-gap: 15px 4rem;
  font-size: 10px;
}

@media (max-width: 600px) {
  .mosaic-view-container {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-gap: 1rem;
    font-size: 16px;
  }

  mosaic-view-board {
    width: 100%;
  }

  :deep(.chessboard-craft-container) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
  }
}
</style>
