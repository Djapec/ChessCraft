<template>
  <div class="center-content">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style>
body {
  font-family: 'Figtree', sans-serif;
  margin: 0;
  height: 100vh;
}

.center-content{
  @media (max-width: 600px) {
    display: block;
  }
}
</style>
