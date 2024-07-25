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
            :class="{ 'focused': index === currentGameIndex && !isMosaicViewEnabled }"
            class="game-round"
            @click="isMosaicViewEnabled ? addGameToMosaicView(game) : selectGame(index, game)"
        >
          <input
              type="checkbox"
              v-if="isMosaicViewEnabled"
              name="mosaic-view-option"
              class="mosaic-view-selection-checkbox"
              :disabled="mosaicViewGamesIndices.length >= 4 && mosaicViewGamesIndices.indexOf(game.parsedData.id) === -1"
              :checked="mosaicViewGamesIndices.includes(game.parsedData.id)"
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
  fetchIndexData,
  fetchTournament, generatePgn,
  getExtendedGamesUrls,
  getGamesData,
  validateNumber
} from "./lib/utils";
import { generatePgnForRound } from "./api/round/getRound";
import {
  partlyClonePgn,
  getCurrentMoveScheduledByTime,
  parsePgnWithDelay,
  parseTimeToDate
} from "./pgnParserWithDelay";

export default {
  name: 'PGNUploader',
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
      tournamentId: 'e634fe2c-f0c1-4b07-9519-2ffaaf2c8fd2', // 'e634fe2c-f0c1-4b07-9519-2ffaaf2c8fd2',
      rounds: [],
      intervalActiveGameFetch: null,
      intervalActiveRoundFetch: null,
      currentGameIndex: null,
      previousGameIndex: null,
      currentActiveGame: null,
      previousResponseMoveLength: 0,
      isMoveListChangeForCurrentGame: false,
      delay: 0, // !TODO: make dynamic depending on the audience
      startTournamentTime: new Date(new Date().setHours(19, 7, 0, 0)),
      timeoutIds: []
    };
  },
  computed: {
    filteredGames() {
      return this.games.filter(game => game.name.toLowerCase().includes(this.search.toLowerCase()));
    }
  },
  watch: {
    selectedRound: 'generatePgnForActiveRound'
  },
  methods: {
    async fetchRounds() {
      try {
        const tournament = await fetchTournament(this.tournamentId);
        let roundsNumber = tournament.rounds.length;
        this.rounds = Array.from({ length: roundsNumber }, (_, i) => i + 1);
        this.selectedRound = this.rounds[0];
      } catch (error) {
        console.error("Error fetching rounds: ", error);
      }
    },
    parseMultiplePGNs(fileContent) {
      const pgns = fileContent.split(/\n\n(?=\[)/);
      return pgns.map(pgn => {
        const parsedData = parsePgnWithDelay(pgn, this.startTournamentTime, this.delay)
        //const parsedData = parsePGN(pgn);
        const whitePlayer = parsedData.metadata.White || "Unknown";
        const blackPlayer = parsedData.metadata.Black || "Unknown";
        const result = parsedData.metadata.Result || "N/A";
        const gameName = `${whitePlayer} - ${blackPlayer}`;

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
      if (!this.isMosaicViewEnabled) {
        this.mosaicViewGamesIndices = [];
        bus.$emit('hideMosaicView');
      }

      if (this.mosaicViewGamesIndices.length === 0) {
        bus.$emit('toggleAnalysisBoardVisibility', true);
      }
    },
    addGameToMosaicView(game) {
      const count = this.getLength();
      const itemIndex = this.mosaicViewGamesIndices.indexOf(game.parsedData.id);

      if (count < 4 && itemIndex === -1) {
        this.mosaicViewGamesIndices.push(game.parsedData.id);
      } else if (itemIndex > -1) {
        this.mosaicViewGamesIndices.splice(itemIndex, 1);
      }

      if (count === 1 && itemIndex !== -1) { // last one being removed - return to analysis board
       this.toggleMosaicViewEnabled()
      } else if (count < 4 && itemIndex === -1 || count <= 4 && itemIndex > -1) { // either new one being added or existing removed - load new mosaic setup
        bus.$emit('toggleAnalysisBoardVisibility', false);
        this.sendParsedGamesToMosaicView();
      } else if (count === 4 && itemIndex === -1) { } // attempting to add over 4 - do nothing
    },
    getLength() { // !TODO - there has to be a better way than this!
      let count = 0;
      for (const item of this.mosaicViewGamesIndices) {
        count++;
      }

      return count;
    },
    sendParsedGamesToMosaicView() {
      const parsedDataArray = [];
      for (const gameId of this.mosaicViewGamesIndices) {
        const game = this.filteredGames.find(game => game.parsedData.id === gameId)
        parsedDataArray.push(game.parsedData);
      }

      bus.$emit('generateMosaicView', parsedDataArray);
    },
    selectGame(index, game) {
      this.currentGameIndex = index;
      this.currentActiveGame = game;

      bus.$emit('disableMovementAndControlsWhenChangingGame');

      if (this.delay > 0) { // todo: fix this
        this.clearAllTimeouts()
        this.presentGameWithDelay()
      } else if (this.currentActiveGame.result === '*') {
        this.fetchActiveGame()
      } else {
        this.loadGame(game.parsedData);
      }
    },
    async fetchActiveGame() {
      if (this.currentGameIndex !== null && this.currentActiveGame.result === '*') {
        const gameStr = this.currentGameIndex + 1;
        try {
          const tournament = await fetchTournament(this.tournamentId);
          const round = validateNumber(this.selectedRound);
          const game = validateNumber(gameStr);
          const indexData = await fetchIndexData(this.tournamentId, [round]);

          const extendedGamesUrls = getExtendedGamesUrls(
              this.tournamentId,
              [round],
              indexData
          ).filter((g) => g.game === game);

          const gamesData = await getGamesData(extendedGamesUrls);
          const isMoveListChange = this.previousResponseMoveLength !== gamesData[0].value.moves.length
          const isActiveGameChange = this.previousGameIndex !== this.currentGameIndex
          this.isMoveListChangeForCurrentGame = isMoveListChange && !isActiveGameChange

          if (isMoveListChange || isActiveGameChange) {
            this.previousResponseMoveLength = gamesData[0].value.moves.length;
            this.previousGameIndex = this.currentGameIndex;
            const lookupMap = createGameLookupMap(extendedGamesUrls);
            const pgn = generatePgn(
                tournament,
                indexData,
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
    async fetchActiveMosaicViewGamesFetch() { //todo: potrebno je testiranje
      if (this.delay > 0 && this.mosaicViewGamesIndices.length >= 2) {
        const updatableMosaicViewGames = this.mosaicViewGamesIndices.filter(
            gameId => this.filteredGames.find(game => game.parsedData.id === gameId).parsedData.result === '*'
        );

        if (updatableMosaicViewGames.length > 1) {
          const pgn = await generatePgnForRound(
              this.tournamentId, this.selectedRound, updatableMosaicViewGames.map(i => i - 1)
          );
          const updateMosaicViewGamesPgn = this.parseMultiplePGNs(pgn);
          updateMosaicViewGamesPgn.forEach(targetItem => {
            const index = this.games.findIndex(originalItem => originalItem.name === targetItem.name);
            if (index !== -1)
              this.games[index] = targetItem;
          });
          this.sendParsedGamesToMosaicView()
        }
      } else {
        clearInterval(this.intervalActiveMosaicViewGamesFetch);
      }
    },
    presentGameWithDelay() {
      const moveScheduledByTime = getCurrentMoveScheduledByTime(this.currentActiveGame.parsedData.halfMoves, new Date())
      if (moveScheduledByTime) {
        let partlyClonedGame = partlyClonePgn(this.currentActiveGame.parsedData, moveScheduledByTime.id)
        this.loadGame(partlyClonedGame); // mozda ovo nije potrebno
        this.startMoveIntervals(this.currentActiveGame.parsedData)
      }
    },
    startMoveIntervals(parsedData) {
      this.clearAllTimeouts();
      const now = new Date();

      // Filtriraj poteze koji su već prošli
      const futureMoves = parsedData.halfMoves.filter(move => {
        const targetTime = parseTimeToDate(move.time);
        return targetTime > now;
      });

      // Ako nema budućih poteza, izađi iz funkcije
      if (futureMoves.length === 0) {
        console.log("Svi potezi su već prošli.");
        this.loadGame(parsedData);
        return;
      }

      const scheduleNextMove = (moves, index) => {
        if (index >= moves.length) return;

        const move = moves[index];
        const targetTime = parseTimeToDate(move.time);
        const delay = targetTime - new Date(); // Kašnjenje u milisekundama

        const timeoutId = setTimeout(() => {
          const moveScheduledByTime = getCurrentMoveScheduledByTime(this.currentActiveGame.parsedData.halfMoves, new Date());
          let partlyClonedGame = partlyClonePgn(this.currentActiveGame.parsedData, moveScheduledByTime.id);

          console.log(`Move ${moveScheduledByTime.id}: ${move.color} plays ${move.move} at ${move.time}`);
          this.updateGame(partlyClonedGame);

          // Planiraj sledeći potez
          scheduleNextMove(moves, index + 1);
        }, delay);

        this.timeoutIds.push(timeoutId);
      };

      // Planiraj prvi budući potez
      scheduleNextMove(futureMoves, 0);

      // Prikaz prvog poteza odmah ako je propušten
      const nextMove = futureMoves[0];
      console.log(`Next Move ${nextMove.id}: ${nextMove.color} plays ${nextMove.move} at ${nextMove.time}`);
    },
    clearAllTimeouts() {
      this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
      this.timeoutIds = [];
    },
    updateGameList(newGameData) {
      const index = this.currentGameIndex; // Indeks drugog elementa (indeksiranje počinje od 0)
      if (index >= 0 && index < this.games.length) {
        this.$set(this.games, index, newGameData); // Ažuriramo element u reaktivnom nizu
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
        this.mosaicViewGamesIndices = [];
        const pgn = await generatePgnForRound(this.tournamentId, this.selectedRound);
        this.games = this.parseMultiplePGNs(pgn);
        if (this.mosaicViewGamesIndices > 1) {
          this.sendParsedGamesToMosaicView()
        }
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
    await this.fetchRounds();
    await this.generatePgnForActiveRound();
    this.intervalActiveGameFetch = setInterval(this.fetchActiveGame, 5000);
    this.intervalActiveMosaicViewGamesFetch = setInterval(this.fetchActiveMosaicViewGamesFetch, 5000);
    this.intervalActiveRoundFetch =
        setInterval(this.fetchActiveRound, this.delay - 1 <= 0 ? 900000 : ((this.delay - 1) * 60000));
  },
  beforeUnmount() {
    clearInterval(this.intervalActiveGameFetch);
    clearInterval(this.intervalActiveMosaicViewGamesFetch);
    clearInterval(this.intervalActiveRoundFetch);
  }
};
</script>

<style scoped>
.pgn-uploader {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  width: 500px;
  margin-left: 0;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header h2 {
  margin: 0;
  flex-shrink: 0;
}
.header select.round-select {
  padding: 5px;
  min-width: 60px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  outline: none;
}
.search-input {
  width: calc(100% - 20px);
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.games-list ul {
  list-style-type: none;
  padding: 0;
}
.games-list ul li {
  display: flex;
  justify-content: space-between;
}
.filtered-game-container  {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  width: 100%;
  cursor: pointer;
}
.game-round {
  border-bottom: 1px solid #ddd;

  &:hover {
    background-color: #f0f0f0;
  }
}
.game-index {
  width: 30px;
}
.game-name {
  flex-grow: 1;
}
.game-result {
  width: 50px;
  text-align: right;
}
.games-list li.focused {
  background-color: #e0e0e0;
}
.mosaic-view-selector {
  margin-bottom: 10px;

  .mosaic-view-label {
    &:hover {
      cursor: pointer;
    }
  }
}
</style>
