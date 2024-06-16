<template>
  <div>
    <h1>Fetch Tournament PGN</h1>
    <input v-model="tournamentId" placeholder="Enter Tournament ID">
    <input v-model="round" placeholder="Enter Round Number" />
    <button @click="fetchPgnForRound">Fetch PGN</button>
  </div>
</template>

<script>
import bus from "@/bus";
import { generatePgnForRound } from "@/components/pgn/api/round/getRound";
import { fetchTournament } from "./lib/utils";

export default {
  name: 'fetchPgn',
  data() {
    return {
      tournamentId: '6c053e0e-5411-4310-bff8-8f4c1d7338db',
      round: ''
    };
  },
  methods: {
    async fetchPgnForRound() {
      try {
        const pgn = await generatePgnForRound(this.tournamentId, this.round);
        this.apiGameLoader(pgn);
      } catch (error) {
        console.error('Error fetching PGN:', error);
      }
    },
    async fetchTournamentRoundsNumber() {
      try {
        const tournament = await fetchTournament(this.tournamentId);
        console.log(tournament.rounds.length);
      } catch (error) {
        console.error('Error fetching PGN:', error);
      }
    },
    apiGameLoader(content) {
      bus.$emit('apiGameLoader', content);
    }
  }
};
</script>

<style scoped>
input {
  margin-right: 10px;
  margin-bottom: 10px;
}

button {
  margin-bottom: 20px;
}
</style>
