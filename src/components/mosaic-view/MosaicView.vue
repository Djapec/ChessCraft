<template>
  <div class='mosaic-view-container'>
    <mosaic-view-board v-show="parsedGames[0]?.chess" :parsed-game-data="parsedGames[0]"></mosaic-view-board>
    <mosaic-view-board v-show="parsedGames[1]?.chess" :parsed-game-data="parsedGames[1]"></mosaic-view-board>
    <mosaic-view-board v-show="parsedGames[2]?.chess" :parsed-game-data="parsedGames[2]"></mosaic-view-board>
    <mosaic-view-board v-show="parsedGames[3]?.chess" :parsed-game-data="parsedGames[3]"></mosaic-view-board>
  </div>
</template>

<script>
  import MosaicViewBoard from "@/components/mosaic-view/MosaicViewBoard.vue";
  import bus from "@/bus";

  export default {
    name: 'MosaicView',
    components: { MosaicViewBoard },
    data () {
      return {
        parsedGames: [{}, {}, {}, {}],
      }
    },
    created() {
      bus.$on('generateMosaicView', (items) => {
        this.parsedGames = items;
      });
    },
  }
</script>

<style scoped>
  .mosaic-view-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    grid-gap: 4rem;
  }
</style>
