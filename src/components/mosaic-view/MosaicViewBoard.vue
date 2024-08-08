<script>
  import chessBoardCraft from "@/components/chessboard/ChessBoardCraft.vue";
  import {getInfoForLastTwoMoves} from "../chessboard/Util";
  import { Chess } from "../../../public/chess.min.js"
  import {areListsEqual} from "../pgn/utils/util";

  export default {
    name: 'MosaicViewBoard',
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
      }
    },
    watch: {
      parsedGameData: {
        immediate: true,
        handler(newData) {
          this.loadGame(newData);
        }
      }
    },
    methods: {
      loadGame(parsedData) {
        if (parsedData?.chess) {
          if(areListsEqual(this.game.history(),parsedData.chess.history()) && !this.liveGame) {
            this.game = new Chess();
            this.loadPosition();
          }
          this.game = parsedData.chess;
          this.parsedPgnData = parsedData;
          this.loadPlayers();
          this.updateMosaicViewPlayersClock()
          this.loadPosition();
        }
      },
      updateMosaicViewPlayersClock() {
        if (this.viewOnly) {
          if (this.parsedPgnData?.halfMoves.length > 0) {
            const moveDetails = {
              moveNumber: this.parsedPgnData.halfMoves.length - 1,
              playedMove: this.parsedPgnData.halfMoves[this.parsedPgnData.halfMoves.length - 1].move
            }
            const movesInfo = getInfoForLastTwoMoves(this.parsedPgnData, moveDetails)

            this[movesInfo.currentMoveInfo.color === "white" ? "whitePlayerClock" : "blackPlayerClock"] =
                movesInfo.currentMoveInfo.clock;
            if (movesInfo.previousMoveInfo !== null) {
              this[movesInfo.previousMoveInfo.color === "white" ? "whitePlayerClock" : "blackPlayerClock"] =
                  movesInfo.previousMoveInfo.clock;
            }
          }
        }
      },
    },
    mounted() {
      this.board.set({
        viewOnly: true,
      });
    },
  }

</script>
