<script>
import chessBoardCraft from "@/components/chessboard/ChessBoardCraft.vue";
import { getAllProperties, getMove } from '@/components/chessboard/Util.js'
import { Chess } from "../../public/chess.min.js"
import bus from '../bus.js'

export default {
  name: 'analysis',
  extends: chessBoardCraft,
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
        this.board.set({ highlight: {lastMove: false} }) // todo: fix bug
        this.setOnlyViewMod(isViewOnly);
        this.currentGamePgn = this.game.pgn();
      }
    },
    loadGame(parsedData) {
      this.game = parsedData.chess
      this.parsedPgnData = parsedData
      console.log(getAllProperties(this.parsedPgnData.moves))
      console.log(getAllProperties(this.parsedPgnData.metadata))
      this.loadPlayers()
      this.loadPosition();
      this.setOnlyViewMod(true)
      this.currentChessGame = parsedData.chess;
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
    },
    updatePlayersClock(moveDetails) {
      // todo: check if this.parsedPgnData is not null
      const moveInfo = getMove(this.parsedPgnData, moveDetails)
      console.log(moveInfo)
    }
  },
  mounted() {
    this.board.set({
      viewOnly: true
    })
  },
  created() {
      bus.$on('updatePlayersClock', (moveDetails) => {
        this.updatePlayersClock(moveDetails)
      }),
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
</script>