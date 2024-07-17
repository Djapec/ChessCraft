<template>
  <button @click="handleClick" class="svg-button">
    <div v-html="svgContent" class="svg-container"></div>
  </button>
</template>

<script>
export default {
  name: 'SvgButton',
  props: {
    svgContent: {
      type: String,
      required: true,
    },
  },
  emits: ['click'],
  methods: {
    handleClick() {
      this.$emit('click');
    },
  },
};
</script>

<style scoped>
.svg-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.svg-container {
  width: 50px;
  height: 50px;
}
</style>
