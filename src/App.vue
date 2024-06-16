<template>
  <div id="app">
    <h1>Simple Chessboard by Pedja</h1>
    <analysis :fen="currentFen" @onMove="showInfo" :showThreats="false"/>
    <movesControlBoard/>

<!--    <h1>Simple Chessboard that shows threats for current position and player</h1>-->
<!--    <chessboard :showThreats="true"/>-->

<!--    <h1>Multiple Chessboards with different fens. </h1>-->
<!--    <div v-for="fen in fens" :key="fen">-->
<!--      <chessboard :fen="fen" />-->
<!--    </div>-->

    <div>
      <fetchPgn/>
    </div>

    <engine/>
  </div>
</template>

<script>
import analysis from './components/AnalysisBoard.vue';
import movesControlBoard from './components/MovesControlBoard.vue';
import engine from './components/Stockfish.vue';
import PGNUploader from './components/pgn/PgnUploader.vue';
import bus from './bus.js';
import fetchPgn from "./components/pgn/FetchPgn.vue";

export default {
  name: 'app',
  components: {
    fetchPgn,
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
      fens: [
        '5rr1/3nqpk1/p3p2p/Pp1pP1pP/2pP1PN1/2P1Q3/2P3P1/R4RK1 b - f3 0 28',
        'r4rk1/pp1b3p/6p1/8/3NpP2/1P4P1/P2K3P/R6R w - - 0 22'
      ],
    };
  },
  methods: {
    showInfo(data) {
      this.positionInfo = data;
      bus.$emit('analyzePosition', this.positionInfo.fen, getFirstLetter(this.positionInfo.turn));
      if (this.positionInfo.history.length !== 0) {
        bus.$emit('updatePlayersClock', getLastMove(this.positionInfo.history, this.positionInfo.turn));
      }
    }
  }
};

function getLastMove(history, turn) {
  let color = "";
  if (turn === 'white') {
    color = 'black';
  } else {
    color = 'white';
  }
  return {
    moveNumber: history.length - 1,
    color: color,
    playedMove: history[history.length - 1]
  };
}

function getFirstLetter(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return '';
  }
  return str.charAt(0);
}

</script>
