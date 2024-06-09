<template>
  <div>
    <h1>Fetch Tournament PGN</h1>
    <input v-model="tournamentId" placeholder="Enter Tournament ID" />
    <input v-model="round" placeholder="Enter Round Number" />
    <button @click="fetchPgn">Fetch PGN</button>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { generatePgnForRound } from './api/round/getRound.ts';

export default defineComponent({
  name: 'FetchPgn',
  setup() {
    const tournamentId = ref('');
    const round = ref('');

    const fetchPgn = async () => {
      try {
        const pgn = await generatePgnForRound(tournamentId.value, round.value);
        console.log('Generated PGN:', pgn);
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
});
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
