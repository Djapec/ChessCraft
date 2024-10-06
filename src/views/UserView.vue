<template>
  <div id="app-user-view" class="app-container">
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
#app-user-view {
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: row;
  flex-direction: row;
  -webkit-align-items: center;
  align-items: center;
  -webkit-justify-content: center;
  justify-content: center;
}

@media screen and (max-width: 2100px) {
  #app-user-view {
    -webkit-flex-direction: column;
    flex-direction: column;
  }
}

@media screen and (max-width: 600px) {
  #app-user-view {
    -webkit-flex-direction: column;
    flex-direction: column;
    -webkit-align-items: center;
    align-items: center;
  }
}

:deep(.pgn-uploader) {
  @media screen and (max-width: 600px) {
    width: 350px;
  }
}

.left-side {
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  align-items: center;
  -webkit-justify-content: center;
  justify-content: center;
}

.board-with-controls {
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  align-items: center;
}

.side-container {
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
  margin-left: 20px;
}

@media screen and (max-width: 600px) {
  .side-container {
    -webkit-flex-direction: column;
    flex-direction: column;
    margin-left: 0;
  }
}

.main-container {
  display: -webkit-flex;
  display: flex;
  -webkit-align-items: flex-start;
  align-items: flex-start;
  margin-top: 20px;
}

@media screen and (max-width: 600px) {
  .main-container {
    -webkit-flex-direction: column;
    flex-direction: column;
    margin-top: 0;
  }
}

.mosaic-game-view {
  display: -webkit-flex;
  display: flex;
  -webkit-flex-direction: column;
  flex-direction: column;
}

@media screen and (max-width: 600px) {
  .mosaic-game-view {
    -webkit-flex-direction: column;
    flex-direction: column;
    margin-left: 0;
  }
}
</style>

