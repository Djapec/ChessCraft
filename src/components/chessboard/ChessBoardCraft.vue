<template>
  <div>
    <div><p> {{blackPlayer}} | {{blackPlayerClock}} </p></div>
    <div class="blue merida">
      <div ref="board" class="cg-board-wrap"></div> <br>
    </div>
    <div><p> {{whitePlayer}} | {{whitePlayerClock}} </p></div>
  </div>
</template>

<script>
import { Chess } from "../../../public/chess.min.js"
import { Chessground } from 'chessground'
import { uniques } from './Util.js'
import "./style/theme.css"

export default {
  name: 'chessboardCraft',
  data() {
    return {
      whitePlayer: "Player 1",
      blackPlayer: "Player 2",
      whitePlayerClock: "",
      blackPlayerClock: "",
    }
  },
  props: {
    fen: {
      type: String,
      default: '',
    },
    free: {
      type: Boolean,
      default: false,
    },
    showThreats: {
      type: Boolean,
      default: false,
    },
    onPromotion: {
      type: Function,
      default: () => {
        let piece;
        while (!['q', 'r', 'b', 'n'].includes(piece)) {
          piece = prompt("Promote pawn to (q - queen, r - rook, b - bishop, n - knight):").toLowerCase();
        }
        return piece || 'q';
      },
    },
    orientation: {
      type: String,
      default: 'white',
    },
  },
  watch: {
    fen: function (newFen) {
      this.loadPosition(newFen)
    },
    orientation: function (orientation) {
      this.loadPosition(this.fen, orientation)
    },
    showThreats: function (st) {
      if (st) {
        this.paintThreats(st)
      } else {
        this.board.setShapes([])
      }
    },
  },
  methods: {
    possibleMoves() {
      const dests = new Map()
      const squares = this.getSquares()
      squares.forEach(s => {
        const ms = this.game.moves({ square: s, verbose: true })
        if (ms.length) dests.set(s, ms.map(m => m.to))
      })
      return dests
    },
    getSquares() {
      const squares = []
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8']
      for (const file of files) {
        for (const rank of ranks) {
          squares.push(file + rank)
        }
      }
      return squares
    },
    opponentMoves() {
      let originalPGN = this.game.pgn()
      let tokens = this.game.fen().split(' ')
      tokens[1] = tokens[1] === 'w' ? 'b' : 'w'
      tokens = tokens.join(' ')
      let valid = this.game.load(tokens)
      if (valid) {
        let moves = this.game.moves({ verbose: true })
        this.game.load_pgn(originalPGN)
        return moves
      } else {
        return []
      }
    },
    toColor() {
      return (this.game.turn() === 'w') ? 'white' : 'black'
    },
    paintThreats(showAllThreats) {
      let history = this.game.history({ verbose: true });
      let moves = this.game.moves({ verbose: true })
      let threats = []
      if (showAllThreats) {
        moves.forEach(function (move) {
          threats.push({orig: move.to, brush: 'yellow'})
          if (move['captured']) {
            threats.push({orig: move.from, dest: move.to, brush: 'red'})
          }

          if (move['san'].includes('+')) {
            threats.push({orig: move.from, dest: move.to, brush: 'blue'})
          }
        });
      }

      if (this.game.in_check()) {
        threats.push({ orig: this.getKingSquare(), brush: 'red' });
      }

      if (history.length > 0) {
        const lastMove = history[history.length - 1];
        threats.push({ orig: lastMove.from, dest: lastMove.to, brush: 'green' });
      }

      this.board.setShapes(threats);
    },
    getKingSquare() {
      const board = this.game.board();
      for (let row of board) {
        for (let piece of row) {
          if (piece && piece.type === 'k' && piece.color === this.game.turn()) {
            const file = 'abcdefgh'[row.indexOf(piece)];
            const rank = 8 - board.indexOf(row);
            return file + rank;
          }
        }
      }
      return null;
    },
    calculatePromotions() {
      let moves = this.game.moves({ verbose: true })
      this.promotions = []
      for (let move of moves) {
        if (move.promotion) {
          this.promotions.push(move)
        }
      }
    },
    isPromotion(orig, dest) {
      let filteredPromotions = this.promotions.filter(move => move.from === orig && move.to === dest)
      return filteredPromotions.length > 0
    },
    changeTurn() {
      return (orig, dest) => {
        if (this.isPromotion(orig, dest)) {
          this.promoteTo = this.onPromotion()
        }
        this.game.move({ from: orig, to: dest, promotion: this.promoteTo })
        this.board.set({
          fen: this.game.fen(),
          turnColor: this.toColor(),
          movable: {
            color: this.toColor(),
            dests: this.possibleMoves(),
          },
        })
        this.calculatePromotions()
        this.afterMove()
      }
    },
    afterMove() {
      this.paintThreats(this.showThreats)

      let threats = this.countThreats(this.toColor()) || {}
      threats['history'] = this.game.history()
      threats['fen'] = this.game.fen()
      this.$emit('onMove', threats)
    },
    countThreats(color) {
      let threats = {}
      let captures = 0
      let checks = 0
      let moves = this.game.moves({ verbose: true })
      if (color !== this.toColor()) {
        moves = this.opponentMoves()
      }
      if (moves.length === 0) {
        return null
      }
      moves.forEach(function (move) {
        if (move['captured']) {
          captures++
        }
        if (move['san'].includes('+')) {
          checks++
        }
      })
      threats[`legal_${color}`] = uniques(moves.map(x => x.from + x.to)).length
      threats[`checks_${color}`] = checks
      threats[`threat_${color}`] = captures
      threats[`turn`] = color
      return threats
    },
    loadPosition(fen = this.fen, orientation = this.orientation) {
      this.game.load(fen)
      if (this.board) {
        this.board.set({
          fen: this.game.fen(),
          highlight: {lastMove: false, check: false},
          turnColor: this.toColor(),
          movable: {
            color: this.toColor(),
            free: this.free,
            dests: this.possibleMoves(),
          },
          orientation: orientation,
        })
      } else {
        this.board = Chessground(this.$refs.board, {
          fen: this.game.fen(),
          turnColor: this.toColor(),
          highlight: {lastMove: false, check: false},
          movable: {
            color: this.toColor(),
            free: this.free,
            dests: this.possibleMoves(),
          },
          orientation: orientation,
          events: {
            move: this.changeTurn(),
          },
        })
      }

      this.calculatePromotions()
      this.afterMove()
    },
    loadPlayers() {
      this.whitePlayer = this.parsedPgnData.metadata.White;
      this.blackPlayer = this.parsedPgnData.metadata.Black;
    }
  },
  mounted() {
    this.loadPosition()
  },
  created() {
    this.game = new Chess()
    this.board = null
    this.promotions = []
    this.promoteTo = 'q'
    this.parsedPgnData = null;
  },
}
</script>
