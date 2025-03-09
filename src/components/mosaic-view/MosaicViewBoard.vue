<script>
  import chessBoardCraft from "@/components/chess-board/ChessBoardCraft.vue";
  import {getInfoForLastTwoMoves} from "../chess-board/Util";
  import { Chess } from "../../../public/chess.min.js"
  import {areListsEqual} from "../../utils/util";

  export default {
    name: 'mosaicViewBoard',
    inject: ['config'],
    extends: chessBoardCraft,
    data() {
      return {
        viewOnly: true,
        liveGame: false
      }
    },
    props: {
      parsedGameData: {
        type: Object,
      },
      deep: true
    },
    watch: {
      parsedGameData: {
        immediate: true,
        handler(newData) {
          this.loadGame(newData);
        },
      }
    },
    methods: {

      /**
       * Loads a game from the parsed data and updates the game state accordingly.
       * @param {Object} parsedData - The parsed data containing the chess game information.
       */
      loadGame(parsedData) {
        if (!parsedData?.chess) return;

        if (this.shouldResetGame(parsedData)) {
          this.resetGame();
        }

        this.updateGameState(parsedData);
        this.loadPlayers();
        this.updateMosaicViewPlayersClock();
        this.loadPosition();
      },

      /**
       * Checks if the game should be reset based on the current and parsed game histories.
       * @param {Object} parsedData - The parsed data containing the chess game information.
       * @returns {boolean} - True if the game should be reset, false otherwise.
       */
      shouldResetGame(parsedData) {
        return areListsEqual(this.game.history(), parsedData.chess.history()) && !this.liveGame;
      },

      /**
       * Resets the game to a new instance and loads the current position.
       */
      resetGame() {
        this.game = new Chess();
        this.loadPosition();
      },

      /**
       * Updates the game state with the parsed chess data.
       * @param {Object} parsedData - The parsed data containing the chess game information.
       */
      updateGameState(parsedData) {
        this.game = parsedData.chess;
        this.parsedPgnData = parsedData;
      },

      /**
       * Updates the players' clocks in the mosaic view based on the parsed PGN data.
       */
      updateMosaicViewPlayersClock() {
        if (this.viewOnly || this.parsedPgnData?.halfMoves.length > 0) {
          const moveDetails = {
            moveNumber: this.parsedPgnData.halfMoves.length - 1,
            playedMove: this.parsedPgnData.halfMoves[this.parsedPgnData.halfMoves.length - 1]?.move
          }
          if (moveDetails.playedMove) {
            const movesInfo = getInfoForLastTwoMoves(this.parsedPgnData, moveDetails)

            this.updateClockForMove(movesInfo.currentMoveInfo)
            if (movesInfo.previousMoveInfo !== null) {
              this.updateClockForMove(movesInfo.previousMoveInfo)
            }
          }
        }
      },

      /**
       * Updates the clock for a specific move's color.
       * @param {Object} moveInfo - The move information containing color and clock data.
       */
      updateClockForMove(moveInfo) {
        const clockProperty = moveInfo.color === "white" ? "whitePlayerClock" : "blackPlayerClock";
        this[clockProperty] = moveInfo.clock;
      },
    },
    created() {
      this.isLive = this.config.isLive;
    },
    mounted() {
      this.board.set({
        viewOnly: true,
      });
    },
  }

</script>
