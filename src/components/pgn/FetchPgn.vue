<template>
  <div>
    <h1>Fetch Tournament PGN</h1>
    <input v-model="tournamentId" placeholder="Enter Tournament ID" />
    <input v-model="round" placeholder="Enter Round Number" />
    <button @click="fetchPgn">Fetch PGN</button>
  </div>
</template>

<script>
import { ref } from 'vue';
import { validateNumber, fetchTournament } from '/src/components/pgn/lib/utils'; // Prilagodite putanju u skladu sa vašom strukturom projekta

export default {
  name: 'fetchPgn',
  setup() {
    const tournamentId = ref('');
    const round = ref('');

    const fetchPgn = async () => {
      try {
        const validatedRound = validateNumber(round.value);
        const tournament = await fetchTournament(tournamentId.value);
        console.log('Validated Round:', validatedRound);
        console.log('Fetched Tournament:', tournament);
      } catch (error) {
        console.error('Error fetching PGN:', error);
      }
    };

    return {
      tournamentId,
      round,
      fetchPgn,
    };
  },
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
