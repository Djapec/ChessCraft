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

      // Exact maximum case
      if (absEval >= 50) {
        return 50; // Full half
      }


      // Get dynamic alpha and maxFill based on evaluation range
      let alpha;
      let maxFill;

      if (absEval <= 3) {
        alpha = 1.7;  // Steeper curve for small advantages
        maxFill = 85;
      } else if (absEval <= 6) {
        alpha = 1.7;  // Medium curve
        maxFill = 90;
      } else if (absEval <= 9) {
        alpha = 1.2;  // Gentler curve
        maxFill = 94;
      } else if (absEval <= 12) {
        alpha = 1;  // Even gentler
        maxFill = 97.5;
      }

      // Calculate the fill percentage using the dynamic alpha
      const normalizedValue = absEval / 7;
      const scale = 1 - Math.exp(-alpha * normalizedValue);
      const basePercentage = (scale * maxFill) / 2;

      // Cap at the appropriate maximum fill for this range
      return Math.min(basePercentage, maxFill / 2);
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
