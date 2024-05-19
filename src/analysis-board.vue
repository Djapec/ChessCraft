<script>
import { chessboard } from 'vue-chessboard'
import Chess from 'chess.js'
import bus from './bus.js'

export default {
  name: 'analysis',
  extends: chessboard,
  methods: {
    undo() {
      this.game.undo()
      this.board.set({ fen: this.game.fen() })
      this.loadPosition() // uvek ide kad se menja pozicija
    },
    loadGamePgn() {
      var pgn = [
        '[Event "?"]',
        '[Site "?"]',
        '[Date "2015.11.26"]',
        '[Round "?"]',
        '[White "Anish Giri"]',
        '[Black "Teimour Radjabov"]',
        '[Result "*"]',
        '[ECO "C31"]',
        '[PlyCount "8"]\n',
        '1. e4 {[%clk 1:30:57]}  e5 {[%clk 1:30:57]} 2. Nf3 {[%clk 1:31:20]}  Nc6 {[%clk 1:31:23]} 3. Bc4 {[%clk 1:31:40]}  Bc5 {[%clk 1:31:48]} 4. c3 {[%clk 1:31:58]}  Nf6 {[%clk 1:32:10]} 5. d3 {[%clk 1:32:22]}  d6 {[%clk 1:32:26]} 6. a4 {[%clk 1:32:22]}  a6 {[%clk 1:32:47]} 7. O-O {[%clk 1:32:32]}  h6 {[%clk 1:32:55]} 8. b4 {[%clk 1:31:58]}  Ba7 {[%clk 1:33:08]} 9. Re1 {[%clk 1:32:06]}  O-O {[%clk 1:32:55]}'];

      this.game.load_pgn(pgn.join('\n'))

      // console.log("Ovde sam Header: " + this.game.header())
      // Object.entries(this.game.header()).forEach(([key, value]) => {
      //   console.log(`${key}: ${value}`);
      // });

      var chess = new Chess();
      this.game.history().forEach(move => {
        chess.move(move);
        this.board.set({ fen: chess.fen() })
        this.loadPosition() // uvek ide kad se menja pozicija
      });
    },
    makeMove(move) {
      this.game.move(move)
      this.board.set({ fen: this.game.fen() })
      this.loadPosition()
    },
    prevMove(gameHistory) {
      var chess = new Chess();

      for (let i = 0; i < gameHistory.length - 1; i++) {
        let move = gameHistory[i];
        chess.move(move);
      }

      this.game = chess
      this.board.set({ fen: this.game.fen() })
      this.loadPosition();
    },
    firstMove(gameHistory) {
      var chess = new Chess();

      for (let i = 0; i < 2; i++) {
        let move = gameHistory[i];
        chess.move(move);
      }

      this.game = chess
      this.board.set({ fen: this.game.fen() })
      this.loadPosition();
    },
    nextMove(currentHistoryIndex, currentMoveHistory) {
      var startIndex = currentHistoryIndex - 1
      var lastGameMove = this.game.history()[this.game.history().length - 1]

      // proveravam da li su poslednji potezi identicni
      if (lastGameMove == currentMoveHistory[startIndex - 1]) {
        this.game.move(currentMoveHistory[startIndex])
        this.board.set({ fen: this.game.fen() })
        this.loadPosition()
      }
    }
  },
  created() {
      bus.$on('undo', () => {
        this.undo()
      }),
      bus.$on('loadGamePgn', () => {
        this.loadGamePgn()
      })
      bus.$on('prevMove', (gameHistory) => {
        this.prevMove(gameHistory)
      }),
      bus.$on('nextMove', (currentHistoryIndex, currentMoveHistory) => {
        this.nextMove(currentHistoryIndex, currentMoveHistory)
      }),
      bus.$on('firstMove', (gameHistory) => {
        this.firstMove(gameHistory)
      })
  }

}
</script>
