<template>
  <div class="pgn-uploader">
    <div class="header">
      <h2>Choose Round</h2>
      <select v-model="selectedRound" class="round-select">
        <option v-for="round in rounds" :key="round" :value="round">{{ round }}</option>
      </select>
    </div>
    <div class="mosaic-view-selector">
      <label class="mosaic-view-label">
        <input
            id="mosaic-view-select-games"
            name="mosaic-view-select-games"
            type="checkbox"
            v-model="isMosaicViewEnabled"
            @click="toggleMosaicViewEnabled()"
        >
        Select games for mosaic view
      </label>
    </div>
    <input type="text" v-model="search" placeholder="Search..." class="search-input" />
    <div v-if="games.length" class="games-list">
      <ul>
        <li v-for="(game, index) in filteredGames"
            :key="index"
            :class="{ 'focused': game.parsedData.id === currentActiveGame?.parsedData.id && !isMosaicViewEnabled }"
            class="game-round"
            @click="isMosaicViewEnabled ? addGameToMosaicView(index, game) : selectGame(index, game)"
        >
          <input
              type="checkbox"
              v-if="isMosaicViewEnabled"
              name="mosaic-view-option"
              class="mosaic-view-selection-checkbox"
              :disabled="mosaicViewGamesIndices.length >= 4 && mosaicViewGamesIndices.findIndex(x => x.id === game.parsedData.id) === -1"
              :checked="mosaicViewGamesIndices.some(x => x.id === game.parsedData.id)"
          >
          <div class="filtered-game-container">
            <span class="game-index">{{ index + 1 }}.</span>
            <span class="game-name">{{ game.name }}</span>
            <span class="game-result">{{ game.result }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import PGNParser from './PgnParser.vue';
import bus from "../../bus";
import {
  createGameLookupMap,
  fetchPairsData,
  fetchTournament, generatePgn,
  getGamesUrls,
  getGamesInfo,
  validateRoundNumber
} from "./utils/util";
import { generatePgnForRound } from "./api/round/getRound";
import {
  partlyClonePgn,
  getCurrentMoveScheduledByTime,
  parseTimeToDate
} from "./utils/util";
import {parsePgnWithDelay} from "./pgnParserWithDelay";

export default {
  name: 'PGNUploader',
  inject: ['config'],
  components: {
    PGNParser
  },
  data() {
    return {
      isMosaicViewEnabled: false,
      mosaicViewGamesIndices: [],
      games: [],
      search: '',
      selectedRound: '',
      rounds: [],
      intervalActiveGameFetch: null,
      intervalActiveRoundFetch: null,
      currentGameIndex: null,
      currentGameId: null,
      previousGameId: null,
      currentActiveGame: null,
      previousResponseMoveLength: 0,
      isMoveListChangeForCurrentGame: false,
      delay: 15,
      startTournamentTime: new Date(new Date().setHours(16, 30, 0, 0)),
      timeoutIds: []
    };
  },
  computed: {
    tournamentId() {
      return this.$route.params.id || 'a655c774-29e4-4b00-90c3-3f4e3871433d';
    },
    filteredGames() {
      return this.games.filter(game => game.name.toLowerCase().includes(this.search.toLowerCase()));
    },
    routeRound() {
      return Number(this.$route.params.roundNumber)
    }
  },
  watch: {
    selectedRound: 'generatePgnForActiveRound'
  },
  methods: {
    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        this.fetchActiveRound()
      }
    },
    async fetchRounds() {
      try {
        const tournament = await fetchTournament(this.tournamentId);
        let roundsNumber = tournament.rounds.length;
        this.rounds = Array.from({ length: roundsNumber }, (_, i) => i + 1);
        this.selectedRound = this.rounds.includes(this.routeRound) ? this.routeRound : this.rounds[0];
      } catch (error) {
        console.error("Error fetching rounds: ", error);
      }
    },
    parseMultiplePGNs(fileContent) {
      const pgns = fileContent.split(/\n\n(?=\[)/);
      let index = 0;
      return pgns.map(pgn => {
        const parsedData = parsePgnWithDelay(pgn, this.startTournamentTime, this.delay)
        const whitePlayer = parsedData.metadata.White || "Unknown";
        const blackPlayer = parsedData.metadata.Black || "Unknown";
        const result = parsedData.metadata.Result || "N/A";
        const gameName = `${whitePlayer} - ${blackPlayer}`;
        parsedData.id = (`${this.selectedRound}-${gameName}`);
        return {
          pgn,
          name: gameName,
          parsedData,
          result
        };
      });
    },
    toggleMosaicViewEnabled() {
      this.isMosaicViewEnabled = !this.isMosaicViewEnabled;
      clearInterval(this.intervalActiveGameFetch);
      if (!this.isMosaicViewEnabled) {
        this.mosaicViewGamesIndices = [];
        bus.$emit('hideMosaicView');
      }

      if (this.mosaicViewGamesIndices.length === 0) {
        bus.$emit('toggleAnalysisBoardVisibility', true);
      }
    },
    addGameToMosaicView(index, game) {
      this.previousGameId = null;
      const count = this.getArrayLength(this.mosaicViewGamesIndices);
      const itemGame = this.mosaicViewGamesIndices.findIndex(x => x.id === game.parsedData.id);

      if (count < 4 && itemGame === -1) {
        this.mosaicViewGamesIndices.push({id: game.parsedData.id, gameIndex: index});
      } else if (itemGame > -1) {
        this.mosaicViewGamesIndices.splice(itemGame, 1);
      }

      if (count === 1 && itemGame !== -1) {
       this.toggleMosaicViewEnabled()
        clearInterval(this.intervalActiveMosaicViewGamesFetch);
      } else if (count < 4 && itemGame === -1 || count <= 4 && itemGame > -1) { // either new one being added or existing removed - load new mosaic setup
        bus.$emit('toggleAnalysisBoardVisibility', false);
        this.sendParsedGamesToMosaicView();
        clearInterval(this.intervalActiveMosaicViewGamesFetch);
        this.intervalActiveMosaicViewGamesFetch = setInterval(this.fetchActiveMosaicViewGamesFetch, 5000);
      } else if (count === 4 && itemGame === -1) { }
    },
    getArrayLength(array) { //todo - there has to be a better way than this!
      let count = 0;
      for (const item of array) {
        count++;
      }

      return count;
    },
    sendParsedGamesToMosaicView() {
      const parsedDataArray = [];
      for (const gameData of this.mosaicViewGamesIndices) {
        const game = this.filteredGames.find(game => game.parsedData.id === gameData.id)
        if (game?.parsedData)
          parsedDataArray.push(game.parsedData);
      }

      bus.$emit('generateMosaicView', parsedDataArray);
    },
    selectGame(index, game) {
      this.currentGameIndex = index;
      this.currentGameId = game.parsedData.id
      this.currentActiveGame = game;

      bus.$emit('disableMovementAndControlsWhenChangingGame');

        if (this.currentActiveGame.result === '*') {
          if (this.delay > 0) {
            this.clearAllTimeouts()
            this.presentGameWithDelay()
          } else {
            clearInterval(this.intervalActiveGameFetch)
            this.intervalActiveGameFetch = setInterval(this.fetchActiveGame, 5000);
            this.fetchActiveGame()
        }
      } else {
        this.loadGame(game.parsedData);
          this.previousGameId = this.currentGameId;
      }
    },
    async fetchActiveGame() {
      if (this.currentGameIndex !== null && this.currentActiveGame.result === '*' && this.delay === 0) {
        const gameStr = this.currentGameIndex + 1;
        try {
          const tournament = await fetchTournament(this.tournamentId);
          const round = validateRoundNumber(this.selectedRound);
          const game = validateRoundNumber(gameStr);
          const pairsData = await fetchPairsData(this.tournamentId, [round]);

          const extendedGamesUrls = getGamesUrls(
              this.tournamentId,
              [round],
              pairsData
          ).filter((g) => g.game === game);

          const gamesData = await getGamesInfo(extendedGamesUrls);
          const isMoveListChange = this.previousResponseMoveLength !== gamesData[0].value.moves.length
          const isActiveGameChange = this.previousGameId !== this.currentGameId

          this.isMoveListChangeForCurrentGame = isMoveListChange && !isActiveGameChange

          if (isMoveListChange || isActiveGameChange) {
            this.previousResponseMoveLength = gamesData[0].value.moves.length;
            this.previousGameId = this.currentGameId;
            const lookupMap = createGameLookupMap(extendedGamesUrls);
            const pgn = generatePgn(
                tournament,
                pairsData,
                gamesData,
                extendedGamesUrls,
                lookupMap
            );
            this.loadActiveGame(pgn)
          }
        } catch (error) {
          throw new Error(error);
        }
      } else {
        clearInterval(this.intervalActiveGameFetch);
      }
    },
    async fetchActiveMosaicViewGamesFetch() {
      if (this.delay === 0 && this.mosaicViewGamesIndices.length >= 1) {
        const updatableMosaicViewGames = this.mosaicViewGamesIndices.map(game => game.gameIndex + 1);

        // todo: update only result active games
        if (updatableMosaicViewGames.length > 1) {
          const pgn = await generatePgnForRound(this.tournamentId, this.selectedRound, updatableMosaicViewGames);

          if (pgn !== null) {
            const parsedDataArray = [];
            const updateMosaicViewGamesPgn = this.parseMultiplePGNs(pgn);
            updateMosaicViewGamesPgn.forEach(targetItem => {
              const index = this.games.findIndex(originalItem => originalItem.name === targetItem.name);
              if (index !== -1) {
                this.games[index] = targetItem;
                parsedDataArray.push(this.games[index].parsedData)
              }
            });
            bus.$emit('generateMosaicView', parsedDataArray);
          }
        }
      } else {
        clearInterval(this.intervalActiveMosaicViewGamesFetch);
      }
    },
    presentGameWithDelay() {
      const moveScheduledByTime = getCurrentMoveScheduledByTime(this.currentActiveGame.parsedData.halfMoves, new Date())
      let moveId = moveScheduledByTime ? moveScheduledByTime.id : 0;
      let partlyClonedGame = partlyClonePgn(this.currentActiveGame.parsedData, moveId);
      this.loadGame(partlyClonedGame);

      if (moveScheduledByTime) {
        this.startMoveIntervals(this.currentActiveGame.parsedData);
      }
    },
    startMoveIntervals(parsedData) {
      this.clearAllTimeouts();
      const now = new Date();

      const futureMoves = parsedData.halfMoves.filter(move => {
        const targetTime = parseTimeToDate(move.time);
        return targetTime > now;
      });

      if (futureMoves.length === 0) {
        console.log("Svi potezi su već prošli.");
        this.loadGame(parsedData);
        return;
      }

      const scheduleNextMove = (moves, index) => {
        if (index >= moves.length) return;

        const move = moves[index];
        const targetTime = parseTimeToDate(move.time);
        const delay = targetTime - new Date();

        const timeoutId = setTimeout(() => {
          const moveScheduledByTime = getCurrentMoveScheduledByTime(this.currentActiveGame.parsedData.halfMoves, new Date());
          let partlyClonedGame = partlyClonePgn(this.currentActiveGame.parsedData, moveScheduledByTime.id);

          console.log(`Move ${moveScheduledByTime.id}: ${move.color} plays ${move.move} at ${move.time}`);
          this.updateGame(partlyClonedGame);

          scheduleNextMove(moves, index + 1);
        }, delay);

        this.timeoutIds.push(timeoutId);
      };

      scheduleNextMove(futureMoves, 0);
      const nextMove = futureMoves[0];
      console.log(`Next Move ${nextMove.id}: ${nextMove.color} plays ${nextMove.move} at ${nextMove.time}`);
    },
    clearAllTimeouts() {
      this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
      this.timeoutIds = [];
    },
    updateGameList(newGameData) {
      const index = this.currentGameIndex;
      if (index >= 0 && index < this.games.length) {
        this.$set(this.games, index, newGameData);
      }
    },
    loadActiveGame(pgn) {
      this.currentActiveGame = this.parseMultiplePGNs(pgn)[0];
      this.updateGameList(this.currentActiveGame)
      if (this.isMoveListChangeForCurrentGame) {
        this.updateGame(this.currentActiveGame.parsedData);
      } else {
        this.loadGame(this.currentActiveGame.parsedData);
      }
    },
    loadGame(parsedData) {
      bus.$emit('loadGame', parsedData);
    },
    updateGame(parsedData) {
      bus.$emit('updateGame', parsedData);
    },
    async generatePgnForActiveRound() {
      if (this.selectedRound) {
        clearInterval(this.intervalActiveRoundFetch);
        this.intervalActiveRoundFetch =
            setInterval(this.fetchActiveRound, this.delay - 1 <= 0 ? 900000 : ((this.delay * 0.6) * 60000));
        const pgn = await generatePgnForRound(this.tournamentId, this.selectedRound);
        if (pgn !== null) {
          this.games = this.parseMultiplePGNs(pgn);
          if (this.mosaicViewGamesIndices.length > 1) {
            this.sendParsedGamesToMosaicView()
          } else if (this.delay > 0 && this.currentActiveGame) {
            this.currentActiveGame = this.filteredGames.find(game => game.parsedData.id === this.currentActiveGame.parsedData.id);
            if (this.currentActiveGame) {
              this.clearAllTimeouts()
              this.presentGameWithDelay()
            }
          }
        }
        else
          this.games = [];
      }
    },
    async fetchActiveRound() {
      const isRoundHaveUnfinishedGames = this.games.filter(game => game.result === '*').length === 0;
      if (!isRoundHaveUnfinishedGames) {
        await this.generatePgnForActiveRound()
      } else {
        clearInterval(this.intervalActiveRoundFetch);
      }
    }
  },
  async created() {
    this.delay = this.config.delay;
    await this.fetchRounds();
    await this.generatePgnForActiveRound();
  },
  mounted() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },
  beforeUnmount() {
    clearInterval(this.intervalActiveGameFetch);
    clearInterval(this.intervalActiveMosaicViewGamesFetch);
    clearInterval(this.intervalActiveRoundFetch);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
};
</script>

<style scoped>
.pgn-uploader {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  width: 500px;
  margin: 0 auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.header h2 {
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
}

.header select.round-select {
  padding: 8px;
  width: 60px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f8f8f8;
  color: #333;
  cursor: pointer;
}

.mosaic-view-selector {
  margin-bottom: 10px;
}

.mosaic-view-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #555;
  cursor: pointer;
}

.mosaic-view-label input {
  margin-right: 8px;
}

.search-input {
  width: 96%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: #f8f8f8;
}

.games-list {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  border-top: 1px solid #ddd;
}

.games-list ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.games-list ul li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.filtered-game-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.game-index {
  width: 30px;
  text-align: center;
  font-weight: 500;
  color: #333;
}

.game-name {
  flex-grow: 1;
  text-align: left;
  font-size: 14px;
  color: #333;
}

.game-result {
  width: 60px;
  text-align: right;
  font-weight: 400;
  font-size: 14px;
  color: #555;
}

.games-list li.focused {
  background-color: #f0f0f0;
}

.games-list li:hover {
  background-color: #f0f0f0;
}
</style>

