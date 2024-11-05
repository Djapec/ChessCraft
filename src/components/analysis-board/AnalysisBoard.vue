<script>

import { Chess } from "../../../public/chess.min.js"
import bus from '../../bus.js'
import chessBoardCraft from "../chess-board/ChessBoardCraft.vue";
import { getInfoForLastTwoMoves } from "../chess-board/Util";
import {clockUsageTest} from "../clock";

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
    /**
     * Undo last game move, available only for 'viewOnly: false' mod
     */
    undo() {
      this.game.undo()
      this.loadPosition()
    },

    /**
     * Toggles the game movement mode between view-only and interactive.
     * @param {boolean} isViewOnly - A flag indicating whether the mode should be view-only.
     */
    toggleMovement(isViewOnly) {
      this.setOnlyViewMod(isViewOnly);

      if (isViewOnly) {
        if (this.currentGamePgn) {
          this.loadGameState();
          this.currentGamePgn = null;
        }
      } else {
        this.currentGamePgn = this.game.pgn();
      }
    },

    /**
     * Loads the current game state or position from PGN.
     * If `gameStateDuringMovementMode` exists, it is loaded.
     * Otherwise, the current PGN and position are loaded.
     */
    loadGameState() {
      if (this.gameStateDuringMovementMode) {
        this.loadGame(this.gameStateDuringMovementMode);
      } else {
        this.game.load_pgn(this.currentGamePgn);
        this.loadPosition();
      }
    },

    /**
     * Initialization of new game on the board, load game state, status, and info
     * @param {object} parsedData - An object that contains information about the game including chess.js object.
     */
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

    /**
     * Updates the game state based on the parsed data provided.
     * @param {Object} parsedData - An object that contains information about the game including chess.js object.
     */
    updateGame(parsedData) {
      if (this.viewOnly) {
        this.updateGameIfViewOnlyModeIsActive(parsedData);
      } else {
        this.gameStateDuringMovementMode = parsedData;
      }
    },

    /**
     * Updates the properties and state of the game if view-only mode is active.
     * @param {Object} parsedData - An object that contains information about the game including chess.js object.
     */
    updateGameIfViewOnlyModeIsActive(parsedData) {
      this.game = parsedData.chess;
      this.parsedPgnData = parsedData;
      this.currentChessGame = parsedData.chess;
      this.currentMoveHistory = this.game.history();

      if (this.currentHistoryIndex === this.game.history().length - 1) {
        this.currentHistoryIndex = this.game.history().length;
        this.loadPosition();
      }

      this.initControlBoardMoveList();
    },

    /**
     * Loads a random move and updates the game state accordingly.
     * @param {Object} move - The move object containing the ID to set as the current history index.
     */
    loadRandomMove(move) {
      this.currentHistoryIndex = move.id;
      this.game = this.reconstructGameState(this.currentHistoryIndex);
      this.loadPosition();
      this.setOnlyViewMod(true);
    },

    /**
     * Reconstructs the game state up to the specified history index.
     * @param {number} historyIndex - The index up to which the game state should be reconstructed.
     * @returns {Object} - A new Chess object with the moves applied up to the given index.
     */
    reconstructGameState(historyIndex) {
      let chess = new Chess();
      for (let i = 0; i < historyIndex; i++) {
        let move = this.currentMoveHistory[i];
        chess.move(move);
      }

      return chess;
    },

    /**
     * Loads a previous move and updates the game state accordingly.
     */
    prevMove() {
      if (this.currentHistoryIndex !== 0) {
        this.currentHistoryIndex = this.currentHistoryIndex - 1;
        this.game = this.reconstructGameState(this.game.history().length - 1);
        this.loadPosition();
        this.setOnlyViewMod(true)
      }
    },

    /**
     * Moves to the first game's move in the move history if available.
     */
    firstMove() {
      if (this.currentHistoryIndex >= 2) {
        this.currentHistoryIndex = 2;
        this.game = this.reconstructGameState(2);
        this.loadPosition();
        this.setOnlyViewMod(true)
      }
    },

    /**
     * Moves to the next step in the move history if available.
     */
    nextMove() {
      if (this.currentHistoryIndex !== this.currentMoveHistory.length) {
        this.currentHistoryIndex = this.currentHistoryIndex + 1;

        let startIndex = this.currentHistoryIndex - 1;
        let lastGameMove = this.game.history()[this.game.history().length - 1];

        if (lastGameMove === this.currentMoveHistory[startIndex - 1]) {
          this.game.move(this.currentMoveHistory[startIndex])
          this.loadPosition()
          this.setOnlyViewMod(true)
        }
      }
    },

    /**
     * Moves to the last game's move in the move history if available.
     */
    lastMove() {
      if (this.currentChessGame !== null) {
        this.game = this.currentChessGame
        this.loadPosition()
        this.setOnlyViewMod(true)
        this.currentHistoryIndex = this.game.history().length;
        this.currentMoveHistory = this.game.history(); // todo: check if this is needed
      }
    },

    /**
     * Lock/Unlock the chess board
     */
    setOnlyViewMod(isViewOnly) {
      this.viewOnly = isViewOnly;
      this.board.set({ viewOnly: isViewOnly })
    },

    /**
     * Updates the players' clocks based on the provided move details.
     * @param {Object} moveDetails - The details of the current move to process.
     */
    updatePlayersClock(moveDetails) {
      if (!this.viewOnly || this.parsedPgnData === null) {
        return;
      }

      const movesInfo = getInfoForLastTwoMoves(this.parsedPgnData, moveDetails);
      if (!movesInfo) return;

      this.updateClockForMove(movesInfo.currentMoveInfo);
      bus.$emit('updateCurrentMove', movesInfo.currentMoveInfo.id);

      if (movesInfo.previousMoveInfo !== null) {
        this.updateClockForMove(movesInfo.previousMoveInfo);
      }
    },

    /**
     * Updates the clock for a specific move's color.
     * @param {Object} moveInfo - The move information containing color and clock data.
     */
    updateClockForMove(moveInfo) {
      if (!moveInfo || !moveInfo.color) return;
      const clockProperty = moveInfo.color === "white" ? "whitePlayerClock" : "blackPlayerClock";
      this[clockProperty] = moveInfo.clock;
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
