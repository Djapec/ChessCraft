<template>
  <div class="eval-bar-container">
    <div class="eval-bar-background">
      <div class="eval-bar-black" />
      <div class="eval-bar-white" />
    </div>

    <div class="eval-bar-overlay">
      <template v-if="localEvaluation > 0">
        <div
            class="eval-bar-white-overlay"
            :style="{ height: `${overlayHeight}%` }"
        />
      </template>
      <template v-else-if="localEvaluation < 0">
        <div
            class="eval-bar-black-overlay"
            :style="{ height: `${overlayHeight}%` }"
        />
      </template>
    </div>

    <div class="eval-bar-center-line" />
  </div>
</template>

<script>
import bus from "../../bus";
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
  name: 'evaluationBar',
  props: {
    evaluation: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const localEvaluation = ref(props.evaluation);

    const handleEvaluation = (evaluation) => {
      localEvaluation.value = evaluation;
    };

    onMounted(() => {
      bus.$on('evaluation', handleEvaluation);
    });

    onUnmounted(() => {
      bus.$off('evaluation', handleEvaluation);
    });

    const overlayHeight = computed(() => {
      const absEval = Math.abs(localEvaluation.value);

      if (absEval === 100) {
        return 50;
      }

      if (absEval > 7) {
        return (90 / 2);
      }

      if (absEval > 10) {
        return (93.75 / 2);
      }

      if (absEval > 13) {
        return (95.75 / 2);
      }

      if (absEval > 15) {
        return (95.75 / 2);
      }

      return (absEval / 7) * (93.75 / 2);
    });

    return {
      localEvaluation,
      overlayHeight
    };
  }
}
</script>

<style scoped>
.eval-bar-container {
  position: relative;
  height: 400px;
  width: 1rem;
  margin-right: 5px;
  margin-bottom: 16px;
}

.eval-bar-background {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0.125rem;
  overflow: hidden;
}

.eval-bar-black {
  height: 50%;
  background-color: #171717;
}

.eval-bar-white {
  height: 50%;
  background-color: #f5f5f5;
}

.eval-bar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0.125rem;
  overflow: hidden;
}

.eval-bar-white-overlay {
  position: absolute;
  bottom: 50%;
  left: 0;
  right: 0;
  background-color: #f5f5f5;
  transition: all 0.3s;
}

.eval-bar-black-overlay {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  background-color: #171717;
  transition: all 0.3s;
}

.eval-bar-center-line {
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: #a3a3a3;
  top: 50%;
  transform: translateY(-50%);
}
</style>
