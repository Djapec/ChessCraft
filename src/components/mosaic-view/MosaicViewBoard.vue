<script>
  import chessBoardCraft from "@/components/chessboard/ChessBoardCraft.vue";
  import {getInfoForLastTwoMoves} from "../chessboard/Util";
  import { Chess } from "../../../public/chess.min.js"

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
          if(areListsEqual(this.game.history(),parsedData.chess.history())) {
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

  function areListsEqual(list1, list2) {
    // Provera dužine lista
    if (list1.length !== list2.length) {
      return false;
    }

    // Provera elemenata lista
    for (let i = 0; i < list1.length; i++) {
      if (list1[i] !== list2[i]) {
        return false;
      }
    }

    return true;
  }
</script>
