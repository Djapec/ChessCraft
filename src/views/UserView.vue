<template>
  <div id="app">
    <div class="left-side">
      <div class="main-container">
        <PGNUploader />
      </div>
      <div v-if="isAnalysisBoardVisible" class="single-game-view">
        <div class="board-with-controls">
          <div class="analysis-board">
            <analysis
                :fen="currentFen"
                :showThreats="false"
                @onMove="showInfo"/>
          </div>
          <div class="side-container">
            <movesControlBoard/>
            <br>
            <engine/>
          </div>
        </div>
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
  name: 'userView',
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
#app {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;

  @media screen and (max-width: 2100px) {
    flex-direction: column;
  }

  @media screen and (max-width: 600px) {
    flex-direction: column;
    align-items: center;
  }
}

:deep(.pgn-uploader) {
  @media screen and (max-width: 600px) {
    width: 350px;
  }
}

.left-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .board-with-controls {
    display: flex;
    flex-direction: column;
    align-items: center;

    .side-container {
      display: flex;
      flex-direction: column;
      margin-left: 20px;

      @media screen and (max-width: 600px) {
        flex-direction: column;
        margin-left: 0;
      }
    }
  }

  .main-container {
    display: flex;
    align-items: flex-start;
    margin-top: 20px;

    @media screen and (max-width: 600px) {
      flex-direction: column;
      margin-top: 0;
    }
  }

  .mosaic-game-view {
    display: flex;
    flex-direction: column;
    margin-left: 30px;

    @media screen and (max-width: 600px) {
      flex-direction: column;
      margin-left: 0;
    }
  }
}
</style>
