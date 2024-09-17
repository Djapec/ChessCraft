<template>
  <div id="app">
    <div class="left-side">
      <div class="main-container-commentator-view">
        <PGNUploader />
      </div>
      <div v-if="isAnalysisBoardVisible" class="single-game-view">
        <div class="board-with-controls">
          <div class="analysis-board-commentator-view">
            <analysis
                :fen="currentFen"
                :showThreats="false"
                @onMove="showInfo"/>
          </div>
        </div>
        <engine/>
      </div>
      <div v-if="isAnalysisBoardVisible" class="side-container">
        <movesControlBoard/>
      </div>
      <div class="mosaic-game-view">
        <mosaic-view/>
      </div>
    </div>
  </div>
</template>

<script>
import analysis from '../components/AnalysisBoard.vue';
import movesControlBoard from '../components/MovesControlBoard.vue';
import engine from '../components/Stockfish.vue';
import PGNUploader from '../components/pgn/PgnUploader.vue';
import bus from '../bus.js';
import MosaicView from "@/components/mosaic-view/MosaicView.vue";
import {getFirstLetter, getLastMove} from "../components/pgn/utils/util";

export default {
  name: 'commentatorView',
  components: {
    MosaicView,
    analysis,
    engine,
    PGNUploader,
    movesControlBoard,
  },
  data() {
    return {
      currentFen: "",
      positionInfo: null,
      isViewOnly: true,
      buttonsDisabled: false,
      isAnalysisBoardVisible: true
    };
  },
  created() {
    bus.$on('toggleAnalysisBoardVisibility', (analysisBoardTrigger) => {
      this.isAnalysisBoardVisible = analysisBoardTrigger;
    });
  },
  methods: {
    showInfo(data) {
      this.positionInfo = data;
      bus.$emit('analyzePosition', this.positionInfo.fen, getFirstLetter(this.positionInfo.turn), this.positionInfo.history);
      if (this.positionInfo.history.length !== 0) {
        bus.$emit('updatePlayersClock', getLastMove(this.positionInfo.history, this.positionInfo.turn));
      }
    }
  }
};

</script>

<style scoped>
:deep(.pgn-uploader) {
  width: 350px;
}

:deep(.games-list) {
  max-height: 100%;
}

:deep(.analysis-container) {
  margin-top: 20px;
  width: 550px;
}

:deep(.move-list-container) {
  margin-top: 20px;
  width: 350px;
  max-height: 610px;
}

:deep(.move-list) {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  border-top: 1px solid #ddd;
}

#app {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;

  @media screen and (max-width: 2100px) {
    flex-direction: column;
  }
}

.left-side {
  display: flex;
  gap: 20px;

  .board-with-controls {
    display: flex;
    flex-direction: column;
    align-items: center;

    .side-container {
      display: flex;
      flex-direction: column;
      margin-left: 20px;
    }
  }

  .main-container-commentator-view {
    display: flex;
    align-items: flex-start;
    margin-top: 20px;
  }

  .mosaic-game-view {
    display: flex;
    flex-direction: column;
    margin-left: 30px;
  }
}
</style>
