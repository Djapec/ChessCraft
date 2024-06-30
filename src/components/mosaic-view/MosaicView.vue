<template>
  <div class='mosaic-view-container'>
    <template v-for="gameData in parsedGames">
      <analysis :parsed-game-data="gameData"></analysis>
    </template>
  </div>
</template>

<script>
  import analysis from "@/components/AnalysisBoard.vue";
  import bus from "@/bus";

  export default {
    name: 'MosaicView',
    components: {
      analysis,
    },
    data() {
      return {
        parsedGames: [],
      }
    },
    created() {
      bus.$on('loadMosaicView', (items) => {
        this.loadMosaicView(items)
      })
    },
    methods: {
      loadMosaicView(parsedDataArray) {
        this.parsedGames = parsedDataArray;
        // for (const game of parsedDataArray) {
        //   bus.$emit('loadGame', game);
        // }
      }
    },
  }
</script>

<style scoped>
  .mosaic-view-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
</style>
