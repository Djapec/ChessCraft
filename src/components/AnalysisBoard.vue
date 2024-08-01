<script>

import { Chess } from "../../public/chess.min.js"
import bus from '../bus.js'
import chessBoardCraft from "./chessboard/ChessBoardCraft.vue";
import { getInfoForLastTwoMoves } from "./chessboard/Util";

export default {
  name: 'analysis',
  extends: chessBoardCraft,
  data() {
    return {
      currentGamePgn: null,
      currentChessGame: null,
      currentHistoryIndex: 0,
      currentMoveHistory: [],
      viewOnly: true,
      gameStateDuringMovementMode: null
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
        if (this.currentGamePgn) {
          if (this.gameStateDuringMovementMode) {
            this.loadGame(this.gameStateDuringMovementMode)
          } else {
            this.game.load_pgn(this.currentGamePgn)
            this.loadPosition()
          }
          this.setOnlyViewMod(isViewOnly);
          this.currentGamePgn = null;
        }
      } else { //false
        this.setOnlyViewMod(isViewOnly);
        this.currentGamePgn = this.game.pgn();
      }
    },
    loadGame(parsedData) {
      this.game = parsedData.chess
      this.parsedPgnData = parsedData
      this.loadPlayers()
      this.loadPosition();
      this.setOnlyViewMod(true)
      this.currentChessGame = parsedData.chess;
      this.currentHistoryIndex = this.game.history().length;
      this.currentMoveHistory = this.game.history();
      this.initControlBoardMoveList()
    },
    updateGame(parsedData) {
      if(this.viewOnly) {
        this.game = parsedData.chess
        this.parsedPgnData = parsedData
        this.currentChessGame = parsedData.chess;
        this.currentMoveHistory = this.game.history();
        if (this.currentHistoryIndex === this.game.history().length - 1) {
          this.currentHistoryIndex = this.game.history().length;
          this.loadPosition()
        }
        this.initControlBoardMoveList()
      } else {
        this.gameStateDuringMovementMode = parsedData;
      }
    },
    loadRandomMove(move) {
      this.currentHistoryIndex = move.id
      let chess = new Chess();

      for (let i = 0; i < this.currentHistoryIndex; i++) {
        let move = this.currentMoveHistory[i];
        chess.move(move);
      }

      this.game = chess
      this.loadPosition();
      this.setOnlyViewMod(true);
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
        this.currentMoveHistory = this.game.history(); // todo: check if this is needed
      }
    },
    setOnlyViewMod(isViewOnly) {
      this.viewOnly = isViewOnly;
      this.board.set({ viewOnly: isViewOnly })
    },
    updatePlayersClock(moveDetails) {
      if (this.viewOnly) {
        if (this.parsedPgnData !== null) {
          const movesInfo = getInfoForLastTwoMoves(this.parsedPgnData, moveDetails)
          if (movesInfo) {
            this[movesInfo.currentMoveInfo.color === "white" ? "whitePlayerClock" : "blackPlayerClock"] =
                movesInfo.currentMoveInfo.clock;
            bus.$emit('updateCurrentMove', movesInfo.currentMoveInfo.id)
            if (movesInfo.previousMoveInfo !== null) {
              this[movesInfo.previousMoveInfo.color === "white" ? "whitePlayerClock" : "blackPlayerClock"] =
                  movesInfo.previousMoveInfo.clock;
            }
          }
        }
      }
    },
    initControlBoardMoveList() {
      bus.$emit('loadGameMoveList', this.parsedPgnData);
    },
  },
  mounted() {
    this.board.set({
      viewOnly: true
    });
  },
  created() {
      bus.$on('updatePlayersClock', (moveDetails) => {
        this.updatePlayersClock(moveDetails)
      })
      bus.$on('loadRandomMove', (move) => {
        this.loadRandomMove(move)
      })
      bus.$on('undo', () => {
        this.undo()
      })
      bus.$on('prevMove', () => {
        this.prevMove()
      })
      bus.$on('nextMove', () => {
        this.nextMove()
      })
      bus.$on('firstMove', () => {
        this.firstMove()
      })
      bus.$on('lastMove', () => {
        this.lastMove()
      })
      bus.$on('toggleMovement', (isViewOnly) => {
        this.toggleMovement(isViewOnly)
      })
      bus.$on('loadGame', (chess) => {
        this.loadGame(chess)
      })
      bus.$on('updateGame', (chess) => {
        this.updateGame(chess)
      })
  },
}
</script>
