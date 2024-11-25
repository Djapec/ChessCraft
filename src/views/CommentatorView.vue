<template>
  <div id="app-commentator-view">
    <div class="left-side">
      <div class="main-container-commentator-view">
        <gameSelectionManager />
      </div>
      <div v-if="isAnalysisBoardVisible" class="single-game-view">
        <div class="board-with-controls">
          <div class="analysis-board-commentator-view">
            <analysis
                :fen="currentFen"
                :showThreats="false"
                @onMove="sendPositionInfoToEngineAndUpdateClock"/>
          </div>
        </div>
        <onlineEngine :fen="analyzePositionFen" />
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
import analysis from '../components/analysis-board/AnalysisBoard.vue';
import movesControlBoard from '../components/control-board/MovesControlBoard.vue';
import engine from '../components/engine/Stockfish.vue';
import gameSelectionManager from '../components/game-selection-manager/GameSelectionManager.vue';
import bus from '../bus.js';
import MosaicView from "@/components/mosaic-view/MosaicView.vue";
import { getLastMove } from "../utils/util";
import { mapStores } from "pinia";
import { useGameOnTheBoardStore } from "../store/CurrentGameStore";
import onlineEngine from "../components/engine/OnlineEngine.vue";

export default {
  name: 'commentatorView',
  components: {
    onlineEngine,
    MosaicView,
    analysis,
    engine,
    gameSelectionManager,
    movesControlBoard,
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
      isAnalysisBoardVisible: true
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
      if (this.positionInfo.history.length !== 0) {
        this.gameOnTheBoardStore.lastPlayedCurrentGameMove = getLastMove(this.positionInfo.history, this.positionInfo.turn)
      }
    }
  }
};

</script>

<style scoped>
:deep(.pgn-uploader) {
  width: 350px;
  height: 535px;
}

:deep(.games-list) {
  max-height: 80%;
}

:deep(.analysis-container) {
  margin-top: 5px;
  width: 550px;
}

:deep(.move-list-container) {
  margin-top: 20px;
  width: 350px;
  height: 550px;
  padding: 9px;
}

:deep(.move-list) {
  max-height: 430px;
  overflow-y: auto;
  overflow-x: hidden;
  border-top: 1px solid #ddd;
}

#app-commentator-view {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-left: 50px;

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
