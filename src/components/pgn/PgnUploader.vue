<template>
  <div class="pgn-uploader">
    <div class="header">
      <h2>Choose Round</h2>
      <!-- Dropdown za biranje rundi -->
      <select v-model="selectedRound" class="round-select">
        <option v-for="round in rounds" :key="round" :value="round">{{ round }}</option>
      </select>
    </div>
    <!-- Input za pretragu -->
    <input type="text" v-model="search" placeholder="Search..." class="search-input" />
    <div v-if="games.length" class="games-list">
      <ul>
        <li v-for="(game, index) in filteredGames" :key="index" @click="loadGame(game.parsedData)">
          <span class="game-index">{{ index + 1 }}.</span>
          <span class="game-name">{{ game.name }}</span>
          <span class="game-result">{{ game.result }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { parsePGN } from './pgnParser';
import PGNParser from './PgnParser.vue';
import bus from "../../bus";
import {fetchTournament} from "./lib/utils";
import {generatePgnForRound} from "./api/round/getRound";

export default {
  name: 'PGNUploader',
  components: {
    PGNParser
  },
  data() {
    return {
      games: [],
      loading: false,
      search: '',
      selectedRound: '',
      tournamentId: '6c053e0e-5411-4310-bff8-8f4c1d7338db',
      rounds: []
    };
  },
  computed: {
    filteredGames() {
      return this.games.filter(game => game.name.toLowerCase().includes(this.search.toLowerCase()));
    }
  },
  watch: {
    selectedRound: 'apiGameLoader' // Watcher za promenu vrednosti selectedRound
  },
  methods: {
    async fetchRounds() {
      const tournament = await fetchTournament(this.tournamentId);
      let roundsNumber = tournament.rounds.length;
      this.rounds = Array.from({ length: roundsNumber }, (_, i) => i + 1);
      this.selectedRound = this.rounds[0]; // Postavljanje prve opcije kao podrazumevane
    },
    parseMultiplePGNs(fileContent) {
      const pgns = fileContent.split(/\n\n(?=\[)/);
      return pgns.map(pgn => {
        const parsedData = parsePGN(pgn);
        const whitePlayer = parsedData.metadata.White || "Unknown";
        const blackPlayer = parsedData.metadata.Black || "Unknown";
        const result = parsedData.metadata.Result || "N/A";
        const gameName = `${whitePlayer} - ${blackPlayer}`;

        return {
          pgn,
          name: gameName,
          parsedData,
          result
        };
      });
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && file.name.endsWith('.pgn')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          try {
            this.loading = true;
            this.games = this.parseMultiplePGNs(content);
          } catch (error) {
            alert('Error parsing PGN file');
          } finally {
            this.loading = false;
          }
        };
        reader.readAsText(file);
      } else {
        alert('Please upload a valid .pgn file');
      }
    },
    loadGame(parsedData) {
      bus.$emit('loadGame', parsedData);
    },
    async apiGameLoader() {
      if (this.selectedRound) {
        const pgn = await generatePgnForRound(this.tournamentId, this.selectedRound);
        this.games = this.parseMultiplePGNs(pgn);
      }
    }
  },
  async created() {
    await this.apiGameLoader();
    await this.fetchRounds();
  }
};
</script>

<style scoped>
.pgn-uploader {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  max-width: 600px;
  margin-left: 0;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header h2 {
  margin: 0;
  flex-shrink: 0;
}
.header select.round-select {
  padding: 5px;
  min-width: 60px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px; /* Zaobljene ivice */
  outline: none;
}
/* Stilovi za input za pretragu */
.search-input {
  width: calc(100% - 20px); /* Širina u liniji sa pgn-uploader */
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.games-list ul {
  list-style-type: none;
  padding: 0;
}
.games-list li {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}
.games-list li:hover {
  background-color: #f0f0f0;
}
.game-index {
  width: 30px;
}
.game-name {
  flex-grow: 1;
}
.game-result {
  width: 50px;
  text-align: right;
}
</style>
