<template>
  <div id="app">
    <h1>Simple Chessboard by Pedja</h1>
    <analysis :fen="currentFen" @onMove="showInfo"/>
    <!-- <button class="button is-light" @click="loadFenPedja(lopez)">
      {{lopez}}
    </button>-->
    <button class="button is-light" @click="undo()">UNDO</button> 
    <button class="button is-light" @click="loadPgnPedja()">load pgn</button>
    <button class="button is-light" @click="loadPrevMove()">prev move</button>
    <button class="button is-light">next move</button>
    <div>
      {{this.positionInfo}}
    </div>

    <h1>Simple Chessboard that shows threats for current position and player</h1>
    <chessboard :showThreats="true"/>

    <h1>Multiple Chessboards with different fens. </h1>
    <div v-for="fen in fens" :key="fen">
       <chessboard :fen="fen" />
    </div>

  </div>
</template>

<script>
import {chessboard} from 'vue-chessboard'
import 'vue-chessboard/dist/vue-chessboard.css'
import newboard from './newboard.vue'
import analysis from './analysis-board.vue'
import editor from './editor.vue'
import bus from './bus.js'

export default {
  name: 'app',
  components: {
    chessboard,
    newboard,
    editor,
    analysis
  },
  data () {
    return {
      currentFen: '',
      positionInfo: null,
      currentHistoryIndex: 0,
      currentIndex: 0
    }
  },
  methods: {
    showInfo(data) {
      this.positionInfo = data
    },
    loadFen(fen) {
      this.currentFen = fen
      console.log(this.positionInfo.fen)
    },
    loadPrevMove() {
      this.currentHistoryIndex = this.positionInfo.history.length - 1;
      console.log(this.currentHistoryIndex)
      bus.$emit('prevMove', this.positionInfo.history, this.currentHistoryIndex)
    },
    promote() {
      if (confirm("Want to promote to rook? Queen by default") ) {
        return 'r'
      } else {
        return 'q'
      }
    },
    undo() {
      bus.$emit('undo')
    },
    loadPgnPedja() {
      bus.$emit('loadPgnPedja')
    },
    loadFenPedja(fen) {
      bus.$emit('loadFenPedja', fen)
    }
  },
  created() {
    this.fens = ['5rr1/3nqpk1/p3p2p/Pp1pP1pP/2pP1PN1/2P1Q3/2P3P1/R4RK1 b - f3 0 28',
                'r4rk1/pp1b3p/6p1/8/3NpP2/1P4P1/P2K3P/R6R w - - 0 22']
  }
}
</script>
