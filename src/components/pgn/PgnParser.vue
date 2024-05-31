<!--<template>-->
<!--  <div>-->
<!--    <h2>Game Metadata</h2>-->
<!--    <div v-if="parsedPGN.metadata">-->
<!--      <p v-for="(value, key) in parsedPGN.metadata" :key="key">{{ key }}: {{ value }}</p>-->
<!--    </div>-->

<!--    <h2>Moves</h2>-->
<!--    <div v-if="parsedPGN.moves">-->
<!--      <div v-for="(move, index) in parsedPGN.moves" :key="index">-->
<!--        <p>Move {{ index + 1 }}:</p>-->
<!--        <p>White: {{ move.white.move }} (Clock: {{ move.white.clock || 'N/A' }}, EMT: {{ move.white.emt || 'N/A' }})</p>-->
<!--        <p v-if="move.black">Black: {{ move.black.move }} (Clock: {{ move.black.clock || 'N/A' }}, EMT: {{ move.black.emt || 'N/A' }})</p>-->
<!--      </div>-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<script>
import { parsePGN } from './pgnParser';

export default {
  name: 'PGNParser',
  props: {
    pgn: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      parsedPGN: {
        metadata: {},
        moves: [],
        chess: null
      }
    };
  },
  methods: {
    parsePGN
  },
  watch: {
    pgn: {
      immediate: true,
      handler(newPGN) {
        this.parsedPGN = this.parsePGN(newPGN);
      }
    }
  }
};
</script>
