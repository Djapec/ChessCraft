
<script>
import { chessboard }  from 'vue-chessboard'
import Chess from 'chess.js'
import bus from './bus.js'
import {previous, next} from './list-navigator.js'

export default {
  name: 'analysis',
  extends: chessboard,
  methods: {
     loadFenPedja(fen) {
        this.game.load(fen)
        this.board.set({fen: this.game.fen()})
        console.log(fen)
        this.loadPosition()
     },
     undo() {
      this.game.undo()
      this.board.set({fen: this.game.fen()})
      this.loadPosition() // uvek ide kad se menja pozicija
    },
     loadPgnPedja() {
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
        
        var moves = this.game.history();

        const value = this.game.header()["White"];
        console.log("Value for key 'White' is", value);

        console.log("Ovde sam Header: " + this.game.header())
        Object.entries(this.game.header()).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);});
        
        var chess1 = new Chess();
       
        this.game.history().forEach(move => {
        console.log("Ovde sam MOVE: " + move);
        chess1.move(move);
        this.board.set({fen: chess1.fen()})
        this.loadPosition() // uvek ide kad se menja pozicija
        });

        console.log(moves)
     },
     provideHistory() {
        console.log(this.game.history())
     },
     makeMove() {
      this.game.move('e4')
      this.board.set({fen: this.game.fen()})
      this.loadPosition()
     },
     prevMove(gameHistory, currentHistoryIndex) {
      var chess1 = new Chess();
      var steps = [];

      for (let i = 0; i < gameHistory.length; i++) {
          const move = gameHistory[i];
          chess1.move(move);

          // Odredi vrednost polja "turn" na osnovu parnosti iteratora
          var turn = i % 2 === 0 ? 'white' : 'black';

          var chessMoveObj = {
            id : i,
            move: move,
            moveFen: chess1.fen(),
            turn: turn
          };
          steps.push(chessMoveObj)

        //this.loadPosition(); // uvek ide kad se menja pozicija
      }

      console.log(previous(steps, currentHistoryIndex))
      var step = previous(steps, currentHistoryIndex)

      this.game.load(step.element.moveFen)
      this.board.set({fen: step.element.moveFen})
      this.loadPosition();
     }
  },
  created() {
    bus.$on('undo', () => {
      this.undo()
    }),
    bus.$on('loadPgnPedja', () => {
      this.loadPgnPedja()
    }),
    bus.$on('loadFenPedja', (fen) => {
      this.loadFenPedja(fen)
    }),
    bus.$on('prevMove', (gameHistory, currentHistoryIndex) => {
      this.prevMove(gameHistory, currentHistoryIndex)
    })
  }

}
</script>
