<template>
  <div id="app-user-view" class="app-container">
    <div class="left-side">
      <div class="main-container">
        <gameSelectionManager />
      </div>
      <div v-if="isAnalysisBoardVisible" class="single-game-view">
        <div class="board-with-controls">
          <div class="chess-board-screen">
            <evaluationBar :evaluation="value"/>
            <div class="analysis-board">
              <analysis
                  :fen="currentFen"
                  :showThreats="false"
                  @onMove="sendPositionInfoToEngineAndUpdateClock"/>
            </div>
          </div>
          <div class="side-container">
            <movesControlBoard/>
            <br>
<!--            <engine/>-->
            <onlineEngine :fen="analyzePositionFen" />
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
import analysis from '../components/analysis-board/AnalysisBoard.vue';
import movesControlBoard from '../components/control-board/MovesControlBoard.vue';
import engine from '../components/engine/Stockfish.vue';
import gameSelectionManager from '../components/game-selection-manager/GameSelectionManager.vue';
import bus from '../bus.js';
import MosaicView from "@/components/mosaic-view/MosaicView.vue";
import { getLastMove } from "../utils/util";
import { mapStores } from "pinia";
import { useGameOnTheBoardStore } from "../store/currentGameStore";
import onlineEngine from "../components/engine/OnlineEngine.vue";
import evaluationBar from "../components/evaluation-bar/EvaluationBar.vue";

export default {
  name: 'userView',
  components: {
    onlineEngine,
    MosaicView,
    analysis,
    engine,
    gameSelectionManager,
    movesControlBoard,
    evaluationBar
  },
  computed: {
    ...mapStores(useGameOnTheBoardStore),
  },
  data() {
    return {
      currentFen: "",
      analyzePositionFen: "",
      positionInfo: null,
      isViewOnly: true,
      buttonsDisabled: false,
      isAnalysisBoardVisible: true,
      value: 0,
    };
  },
  created() {
    bus.$on('toggleAnalysisBoardVisibility', (analysisBoardTrigger) => {
      this.isAnalysisBoardVisible = analysisBoardTrigger;
    });
  },
  methods: {
    sendPositionInfoToEngineAndUpdateClock(data) {
      this.positionInfo = data;
      this.gameOnTheBoardStore.chessHistoryForEngineAnalyze = this.positionInfo.history;
      this.analyzePositionFen = this.positionInfo.fen;
      //bus.$emit('analyzePosition', this.positionInfo.fen, getFirstLetter(this.positionInfo.turn), this.positionInfo.history);
      if (this.positionInfo.history.length !== 0) {
        this.gameOnTheBoardStore.lastPlayedCurrentGameMove = getLastMove(this.positionInfo.history, this.positionInfo.turn)
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

.chess-board-screen {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
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
}

@media screen and (max-width: 600px) {
  .side-container {
    -webkit-flex-direction: column;
    flex-direction: column;
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

