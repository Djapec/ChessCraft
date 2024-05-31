<script>
import { chessboard } from 'vue-chessboard'
import Chess from 'chess.js'
import bus from '../bus.js'

export default {
  name: 'analysis',
  extends: chessboard,
  data() {
    return {
      currentGamePgn: null,
      currentChessGame: null,
      currentHistoryIndex: 0,
      currentMoveHistory: []
    }
  },
  methods: {
    undo() {
      this.game.undo()
      this.loadPosition()
    },
    toggleMovement(isViewOnly) {
      if (isViewOnly) { //true
        this.setOnlyViewMod(isViewOnly);
        if (this.currentGamePgn !== null) {
          this.game.load_pgn(this.currentGamePgn)
          this.loadPosition()
          this.setOnlyViewMod(isViewOnly);
          this.currentGamePgn = null;
        }
      } else { //false
        this.setOnlyViewMod(isViewOnly);
        this.currentGamePgn = this.game.pgn();
      }
    },
    loadGame(chess) {
      this.game = chess
      this.loadPosition();
      this.setOnlyViewMod(true)
      this.currentChessGame = chess;
      this.currentHistoryIndex = this.game.history().length;
      this.currentMoveHistory = this.game.history();
    },
    prevMove() {
      if (this.currentHistoryIndex !== 0) {
        this.currentHistoryIndex = this.currentHistoryIndex - 1;
        let chess = new Chess();

        for (let i = 0; i < this.game.history().length - 1; i++) {
          let move = this.currentMoveHistory[i];
          chess.move(move);
        }

        this.game = chess
        this.loadPosition();
        this.setOnlyViewMod(true)
      }
    },
    firstMove() {
      if (this.currentHistoryIndex >= 2) {
        this.currentHistoryIndex = 2;
        let chess = new Chess();

        for (let i = 0; i < 2; i++) {
          let move = this.currentMoveHistory[i];
          chess.move(move);
        }

        this.game = chess
        this.loadPosition();
        this.setOnlyViewMod(true)
      }
    },
    nextMove() {
      if (this.currentHistoryIndex !== this.currentMoveHistory.length) {
        this.currentHistoryIndex = this.currentHistoryIndex + 1;

        let startIndex = this.currentHistoryIndex - 1;
        let lastGameMove = this.game.history()[this.game.history().length - 1];

        // proveravam da li su poslednji potezi identicni
        if (lastGameMove === this.currentMoveHistory[startIndex - 1]) {
          this.game.move(this.currentMoveHistory[startIndex])
          this.loadPosition()
          this.setOnlyViewMod(true)
        }
      }
    },
    lastMove() {
      if (this.currentChessGame !== null) {
        this.game = this.currentChessGame
        this.loadPosition()
        this.setOnlyViewMod(true)
        this.currentHistoryIndex = this.game.history().length;
        this.currentMoveHistory = this.game.history();
      }
    },
    setOnlyViewMod(isViewOnly) {
      this.board.set({ viewOnly: isViewOnly })
    }
  },
  mounted() {
    this.board.set({
      viewOnly: true
    })
  },
  created() {
    bus.$on('undo', () => {
      this.undo()
    }),
      bus.$on('prevMove', () => {
        this.prevMove()
      }),
      bus.$on('nextMove', () => {
        this.nextMove()
      }),
      bus.$on('firstMove', () => {
        this.firstMove()
      }),
      bus.$on('lastMove', () => {
        this.lastMove()
      }),
      bus.$on('toggleMovement', (isViewOnly) => {
        this.toggleMovement(isViewOnly)
      }),
      bus.$on('loadGame', (chess) => {
        this.loadGame(chess)
      })
  },
}

function getAllMethods(obj) {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

</script>