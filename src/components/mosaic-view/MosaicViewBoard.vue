<script>
  import chessBoardCraft from "@/components/chessboard/ChessBoardCraft.vue";

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
          this.loadPosition();
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
