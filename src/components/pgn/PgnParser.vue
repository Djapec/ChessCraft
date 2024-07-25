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
