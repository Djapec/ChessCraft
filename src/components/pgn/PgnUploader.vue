<template>
  <div>
    <input type="file" @change="handleFileUpload" accept=".pgn" />
    <div v-if="games.length">
      <h2>Games List</h2>
      <ul>
        <li v-for="(game, index) in games" :key="index" @click="loadGame(game.parsedData.chess)">
          <strong>{{ game.name }}</strong>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { parsePGN } from './pgnParser';
import PGNParser from './PgnParser.vue';
import bus from "@/bus";

export default {
  name: 'PGNUploader',
  components: {
    PGNParser
  },
  data() {
    return {
      games: []
    };
  },
  methods: {
    parseMultiplePGNs(fileContent) {
      const pgns = fileContent.split(/\n\n(?=\[)/); // Split by double newline followed by "["

      return pgns.map(pgn => {
        const parsedData = parsePGN(pgn);
        const whitePlayer = parsedData.metadata.White;
        const blackPlayer = parsedData.metadata.Black;
        const gameName = `${whitePlayer} vs ${blackPlayer}`;

        return {
          pgn,
          name: gameName,
          parsedData
        };
      });
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && file.name.endsWith('.pgn')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          this.games = this.parseMultiplePGNs(content);
        };
        reader.readAsText(file);
      } else {
        alert('Please upload a valid .pgn file');
      }
    },
    loadGame(chess) {
      bus.$emit('loadGame', chess);
    }
  }
};
</script>

<style scoped>
h2 {
  margin-top: 20px;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin-bottom: 10px;
}
</style>
