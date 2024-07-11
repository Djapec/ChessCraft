<script>
  import chessBoardCraft from "@/components/chessboard/ChessBoardCraft.vue";
  import {getInfoForLastTwoMoves} from "../chessboard/Util";

  export default {
    name: 'MosaicViewBoard',
    extends: chessBoardCraft,
    data() {
      return {
        viewOnly: true
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
          this.game = parsedData.chess;
          this.parsedPgnData = parsedData;
          this.loadPlayers();
          this.updateMosaicViewPlayersClock()
          this.loadPosition();
        }
      },
      updateMosaicViewPlayersClock() {
        if (this.viewOnly) {
          if (this.parsedPgnData !== null) {
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
