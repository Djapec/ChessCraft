<template>
  <div class="clock-container">
      <div class="players-container">
        <div
            class="player-clock"
            :class="{
            'active': currentPlayer === 'white' && isActive,
          }"
            @click="handlePlayerClick('white')"
        >
          <div class="time-display-white">{{ formatTime(displayTimes.white) }}</div>
          <div v-if="currentPlayer === 'white' && isActive" class="active-indicator">●</div>
        </div>

        <div
            class="player-clock black-player"
            :class="{
            'active': currentPlayer === 'black' && isActive,
          }"
            @click="handlePlayerClick('black')"
        >
          <div class="time-display-black">{{ formatTime(displayTimes.black) }}</div>
          <div v-if="currentPlayer === 'black' && isActive" class="active-indicator">●</div>
        </div>
      </div>
    </div>
</template>

<script>
import {onMounted, onUnmounted, reactive, ref, watch, watchEffect} from 'vue';

/**
 * ChessClock Component
 *
 * This component displays chess game timing for both players.
 * It calculates remaining time based on move start timestamps,
 * making it accurate even after page refreshes.
 */
export default {
  name: 'ChessClock',

  props: {
    /**
     * Unique identifier for the current game.
     *
     * @type {string}
     * @required
     */
    gameId: {
      type: String,
      required: true,
    },

    /**
     * Current move number to detect external move changes.
     *
     * @type {number}
     * @required
     */
    moveNumber: {
      type: Number,
      required: true,
    },

    /**
     * Remaining time for white player in seconds.
     *
     * @type {number}
     * @required
     */
    whiteTime: {
      type: Number,
      required: true,
    },

    /**
     * Remaining time for black player in seconds.
     *
     * @type {number}
     * @required
     */
    blackTime: {
      type: Number,
      required: true,
    },

    /**
     * Currently active player ('white' or 'black').
     *
     * @type {string}
     * @required
     */
    currentPlayer: {
      type: String,
      required: true,
      validator: value => ['white', 'black'].includes(value)
    },

    /**
     * Whether the game timer is currently active.
     *
     * @type {boolean}
     * @default false
     */
    isActive: {
      type: Boolean,
      default: false,
    },

    /**
     * Timestamp when the current move started (HH:MM:SS or ISO string).
     *
     * @type {string}
     * @default null
     */
    moveStartTime: {
      type: String,
      default: null,
    },


  },

  setup(props) {
    // Timer reference and UI state
    const timer = ref(null);
    const isHidden = ref(false);

    // Display times for both players
    const displayTimes = reactive({
      white: props.whiteTime,
      black: props.blackTime
    });

    /**
     * Parses time string to timestamp.
     * Handles both "HH:MM:SS" format and ISO timestamps.
     *
     * @param {string} timeString - Time string to parse.
     * @returns {number} - Timestamp in milliseconds.
     */
    function parseTimeString(timeString) {
      try {
        // If it's in HH:MM:SS format, convert to today's date with that time
        if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
          const today = new Date();
          const [hours, minutes, seconds] = timeString.split(':').map(Number);
          today.setHours(hours, minutes, seconds, 0);
          return today.getTime();
        }

        // Otherwise, assume it's an ISO timestamp
        return new Date(timeString).getTime();
      } catch (error) {
        console.error('Error parsing time string:', error);
        return Date.now();
      }
    }

    /**
     * Calculates remaining time for the current player based on elapsed time.
     *
     * @returns {number} - Remaining time in seconds.
     */
    function calculateCurrentPlayerRemainingTime() {
      if (!props.isActive || !props.moveStartTime) {
        return displayTimes[props.currentPlayer];
      }

      try {
        const now = Date.now();
        const moveStartTimestamp = parseTimeString(props.moveStartTime);
        const elapsedMilliseconds = now - moveStartTimestamp;
        const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

        // Use current player's time as the initial time when move started
        const initialTime = props.currentPlayer === 'white' ? props.whiteTime : props.blackTime;
        return Math.max(0, initialTime - elapsedSeconds);
      } catch (error) {
        console.error('Error calculating remaining time:', error);
        return displayTimes[props.currentPlayer];
      }
    }

    /**
     * Updates the display times based on current game state.
     */
    function updateDisplayTimes() {
      if (props.isActive && props.moveStartTime) {
        // Calculate current player's time based on elapsed time
        displayTimes[props.currentPlayer] = calculateCurrentPlayerRemainingTime();

        // Keep the other player's time as provided in props
        const otherPlayer = props.currentPlayer === 'white' ? 'black' : 'white';
        displayTimes[otherPlayer] = props.currentPlayer === 'white' ? props.blackTime : props.whiteTime;
      } else {
        // Game not active, use prop values directly
        displayTimes.white = props.whiteTime;
        displayTimes.black = props.blackTime;
      }
    }

    /**
     * Starts the timer interval for updating display times.
     */
    function startTimer() {
      if (timer.value) {
        clearInterval(timer.value);
      }

      timer.value = setInterval(() => {
        updateDisplayTimes();

        // Check for time expiry
        if (displayTimes[props.currentPlayer] <= 0) {
          console.log(`${props.currentPlayer} time expired`);
          stopTimer();
        }
      }, 100); // Update every 100ms for smooth display
    }

    /**
     * Stops the timer interval.
     */
    function stopTimer() {
      if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
      }
    }

    /**
     * Handles player clock clicks (no action needed, just for UI feedback).
     *
     * @param {string} player - The player whose clock was clicked.
     */
    function handlePlayerClick(player) {
      // No action needed - parent component handles game logic
      console.log(`${player} clock clicked`);
    }

    /**
     * Formats time in seconds to HH:MM:SS format.
     *
     * @param {number} seconds - Time in seconds to format.
     * @returns {string} - Formatted time string in HH:MM:SS format.
     */
    function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Toggles the visibility of the clock component.
     */
    function toggleHide() {
      isHidden.value = !isHidden.value;
    }

    /**
     * Watches for changes in game props and updates display accordingly.
     */
    watchEffect(() => {
      // This automatically tracks dependencies
      props.gameId;
      props.moveNumber;
      props.whiteTime;
      props.blackTime;
      props.moveStartTime;

      updateDisplayTimes();
    });

    /**
     * Watches for timer state changes (active/inactive).
     */
    watch(
        () => props.isActive,
        (newValue) => {
          if (newValue) {
            updateDisplayTimes();
            startTimer();
          } else {
            stopTimer();
            updateDisplayTimes();
          }
        }
    );

    /**
     * Initializes the component by updating display times and starting timer if needed.
     */
    onMounted(() => {
      updateDisplayTimes();
      if (props.isActive) {
        startTimer(); // startTimer will check if time > 0 before starting interval
      }
    });

    /**
     * Cleans up by stopping timer when component unmounts.
     */
    onUnmounted(() => {
      stopTimer();
    });

    return {
      // UI state
      isHidden,
      displayTimes,

      // Methods
      toggleHide,
      handlePlayerClick,
      formatTime,
    };
  },
};
</script>

<style scoped>
.clock-container {
  border-bottom: 1px solid #ddd;
  border-radius: 0;
  width: auto;
  padding: 10px;
  overflow: hidden;

  @media screen and (max-width: 600px) {
    width: 340px;
  }
}

.players-container {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.player-clock {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  min-width: 100px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  user-select: none;
  flex: 1;
}

.black-player{
  background: #333333;
  color: #fff;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.time-display-white {
  font-size: 20px;
  font-weight: bold;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  color: #333;
  line-height: 1;
}

.time-display-black {
  font-size: 20px;
  font-weight: bold;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  color: #fff;
  line-height: 1;
}

.active-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #2196F3;
  font-size: 1.2em;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}


@media (max-width: 480px) {
  .players-container {
    flex-direction: column;
  }

  .player-clock {
    width: 100%;
    max-width: 200px;
  }
}
</style>