<template>
  <div id="app">
    <h1>Simple Chessboard by Pedja</h1>
    <analysis :fen="currentFen" @onMove="showInfo"/>
    <button class="button is-light" @click="undo()" :disabled="!buttonsDisabled">UNDO</button>
    <button class="button is-light" @click="loadPgn()" :disabled="buttonsDisabled">load pgn</button>
    <button class="button is-light" @click="loadFirstMove()" :disabled="buttonsDisabled">first move</button>
    <button class="button is-light" @click="loadPrevMove()" :disabled="buttonsDisabled">prev move</button>
    <button class="button is-light" @click="loadNextMove()" :disabled="buttonsDisabled">next move</button>
    <button class="button is-light" @click="loadPgn()" :disabled="buttonsDisabled">last move</button>
    <button @click="toggleMovement()">{{ isViewOnly ? 'Enable' : 'Disable' }} Movement</button>

    <div>
      {{ this.positionInfo }}
      <br>
      {{ this.currentMoveHistory }}
    </div>

    <h1>Simple Chessboard that shows threats for current position and player</h1>
    <chessboard :showThreats="true"/>

    <h1>Multiple Chessboards with different fens. </h1>
    <div v-for="fen in fens" :key="fen">
      <chessboard :fen="fen" />
    </div>

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
      currentHistoryIndex: 0,
      currentMoveHistory: [],
      isViewOnly: true,
      buttonsDisabled: false,
      fens: [
        '5rr1/3nqpk1/p3p2p/Pp1pP1pP/2pP1PN1/2P1Q3/2P3P1/R4RK1 b - f3 0 28',
        'r4rk1/pp1b3p/6p1/8/3NpP2/1P4P1/P2K3P/R6R w - - 0 22'
      ],
      pgnText: `[ePGN "0.1;DGT LiveChess/2.2.6"]
[Event "European Senior Team Chess Championship 2024 - Section 65 +"]
[Site "Terme Catez, Slovenia"]
[Date "2024.05.15"]
[Round "9.1"]
[White "Nunn, John D M"]
[Black "Antunac, Goran"]
[Result "*"]
[TimeControl "90min + 30min/40 moves + 30s/move"]
[WhiteClock "01:25:36"]
[BlackClock "01:21:35"]
[ReferenceTime "W/2024-05-15T14:21:57.339+02:00"]
[WhiteFideId "400017"]
[BlackFideId "14500264"]
[WhiteElo "2552"]
[BlackElo "2332"]

1. e4 c5 {[%clk 01:30:54]} {[%emt 00:00:08]} 2. Nf3 {[%clk 01:31:20]} {[%emt 00:00:04]} e6 {[%clk 01:31:21]} {[%emt 00:00:03]} 3. d4 {[%clk 01:31:41]} {[%emt 00:00:09]} cxd4 {[%clk 01:31:49]} {[%emt 00:00:03]} 4. Nxd4 {[%clk 01:32:05]} {[%emt 00:00:06]} a6 {[%clk 01:32:13]} {[%emt 00:00:06]} 5. Nc3 {[%clk 01:32:15]} {[%emt 00:00:19]} Qc7 {[%clk 01:32:31]} {[%emt 00:00:13]} 6. Bd3 {[%clk 01:32:33]} {[%emt 00:00:12]} Nf6 {[%clk 01:25:10]} {[%emt 00:07:51]} 7. Qe2 {[%clk 01:29:52]} {[%emt 00:03:11]} d6 {[%clk 01:24:20]} {[%emt 00:01:21]} 8. g4 {[%clk 01:25:39]} {[%emt 00:04:42]} Nfd7 {[%clk 01:21:35]} {[%emt 00:03:15]} *`

  };
  },
  methods: {
    showInfo(data) {
      this.positionInfo = data;
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
      if (this.currentHistoryIndex !== 0) {
        this.currentHistoryIndex = this.currentHistoryIndex - 1;
        bus.$emit('prevMove', this.positionInfo.history);
      }
    },
    loadNextMove() {
      if (this.currentHistoryIndex !== this.currentMoveHistory.length) {
        this.currentHistoryIndex = this.currentHistoryIndex + 1;
        bus.$emit('nextMove', this.currentHistoryIndex, this.currentMoveHistory);
      }
    },
    loadFirstMove() {
      if (this.currentHistoryIndex >= 2) {
        this.currentHistoryIndex = 2;
        bus.$emit('firstMove', this.currentMoveHistory);
      }
    },
    promote() {
      return confirm("Want to promote to rook? Queen by default") ? 'r' : 'q';
    },
    undo() {
      bus.$emit('undo');
    },
    loadPgn() {
      bus.$emit('loadGamePgn');
      this.currentHistoryIndex = this.positionInfo.history.length;
      this.currentMoveHistory = this.positionInfo.history;
    }
  }
};
</script>
