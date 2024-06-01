<template>
  <div id="app">
    <h1>Simple Chessboard by Pedja</h1>
    <analysis :fen="currentFen" @onMove="showInfo"/>
    <button class="button is-light" @click="undo()" :disabled="!buttonsDisabled">UNDO</button>
    <button class="button is-light" @click="loadFirstMove()" :disabled="buttonsDisabled">first move</button>
    <button class="button is-light" @click="loadPrevMove()" :disabled="buttonsDisabled">prev move</button>
    <button class="button is-light" @click="loadNextMove()" :disabled="buttonsDisabled">next move</button>
    <button class="button is-light" @click="loadLastMove()" :disabled="buttonsDisabled">last move</button>
    <button @click="toggleMovement()">{{ isViewOnly ? 'Enable' : 'Disable' }} Movement</button>

    <div>
      {{ this.positionInfo }}
    </div>

<!--    <h1>Simple Chessboard that shows threats for current position and player</h1>-->
<!--    <chessboard :showThreats="true"/>-->

<!--    <h1>Multiple Chessboards with different fens. </h1>-->
<!--    <div v-for="fen in fens" :key="fen">-->
<!--      <chessboard :fen="fen" />-->
<!--    </div>-->

    <div>
      <h1>PGN parser</h1>
      <PGNUploader />
    </div>

    <engine/>
  </div>
</template>

<script>
import { chessboard } from 'vue-chessboard';
import 'vue-chessboard/dist/vue-chessboard.css';
import analysis from './components/AnalysisBoard.vue';
import engine from './components/Stockfish.vue';
import PGNUploader from './components/pgn/PgnUploader.vue';
import bus from './bus.js';

export default {
  name: 'app',
  components: {
    chessboard,
    analysis,
    engine,
    PGNUploader
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
      bus.$emit('analyzePosition', this.positionInfo.fen);
    },
    loadFen(fen) {
      this.currentFen = fen;
      console.log(this.positionInfo.fen);
    },
    toggleMovement() {
      this.isViewOnly = !this.isViewOnly;
      this.buttonsDisabled = !this.buttonsDisabled;
      bus.$emit('toggleMovement', this.isViewOnly);
    },
    loadPrevMove() {
      bus.$emit('prevMove');
    },
    loadNextMove() {
      bus.$emit('nextMove');
    },
    loadFirstMove() {
      bus.$emit('firstMove');
    },
    promote() {
      return confirm("Want to promote to rook? Queen by default") ? 'r' : 'q';
    },
    undo() {
      bus.$emit('undo');
    },
    loadLastMove() {
      bus.$emit('lastMove');
    },
  }
};
</script>
