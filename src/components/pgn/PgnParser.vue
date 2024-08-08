<script>
import {parsePgnWithDelay} from "./pgnParserWithDelay";

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
    parsePgnWithDelay
  },
  watch: {
    pgn: {
      immediate: true,
      handler(newPGN) {
        this.parsedPGN = this.parsePgnWithDelay(newPGN);
      }
    }
  }
};
</script>
