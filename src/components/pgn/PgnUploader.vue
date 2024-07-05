<template>
  <div class="pgn-uploader">
    <div class="header">
      <h2>Choose Round</h2>
      <select v-model="selectedRound" class="round-select">
        <option v-for="round in rounds" :key="round" :value="round">{{ round }}</option>
      </select>
    </div>
    <div class="">
      <input
          type="checkbox"
          name="mosaic-view-select-games"
          id="mosaic-view-select-games"
          v-model="isMosaicViewEnabled"
          @click="toggleMosaicViewEnabled()"
      >
      Select games for mosaic view
      <button
          v-if="this.mosaicViewArray.length > 0"
          @click="sendParsedGamesToMosaicView()"
      >
        load mosaic view
      </button>
    </div>
    <input type="text" v-model="search" placeholder="Search..." class="search-input" />
    <div v-if="games.length" class="games-list">
      <ul>
        <li v-for="(game, index) in filteredGames"
            :key="index"
            :class="{ 'focused': index === currentGameIndex }"
        >
          <input
              type="checkbox"
              v-if="isMosaicViewEnabled"
              :disabled="mosaicViewArray.length >= 4 && mosaicViewArray.indexOf(index) === -1"
              name="mosaic-view-option"
              @click="addGameToMosaicView(index)"
          >
          <div class="filtered-game-container" @click="selectGame(index, game)">
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
import {addDelayToTime, clonePGN, getCurrentMove, parsePgnWithDelay, parseTimeToDate} from "./pgnParserWithDelay";

export default {
  name: 'PGNUploader',
  components: {
    PGNParser
  },
  data() {
    return {
      isMosaicViewEnabled: false,
      mosaicViewArray: [],
      games: [],
      search: '',
      selectedRound: '',
      tournamentId: 'e634fe2c-f0c1-4b07-9519-2ffaaf2c8fd2', // 'e634fe2c-f0c1-4b07-9519-2ffaaf2c8fd2',
      rounds: [],
      intervalId: null,
      currentGameIndex: null,
      previousGameIndex: null,
      currentActiveGame: null,
      previousResponseMoveLength: 0,
      isMoveListChangeForCurrentGame: false,
      delay: 5,
      startTournamentTime: new Date(new Date().setHours(8, 29, 0, 0)),
      timeoutIds: []
    };
  },
  computed: {
    filteredGames() {
      return this.games.filter(game => game.name.toLowerCase().includes(this.search.toLowerCase()));
    }
  },
  watch: {
    selectedRound: 'apiGameLoader'
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
        this.mosaicViewArray = [];
      }
    },
    addGameToMosaicView(index) {
      const itemIndex = this.mosaicViewArray.indexOf(index);

      if (this.mosaicViewArray.length < 4 && itemIndex === -1) {
        this.mosaicViewArray.push(index);
      } else if (itemIndex > -1) {
        this.mosaicViewArray.splice(itemIndex, 1);
      }
    },
    sendParsedGamesToMosaicView() {
      const parsedDataArray = [];
      for (const index of this.mosaicViewArray) {
        parsedDataArray.push(this.filteredGames[index].parsedData);
      }

      bus.$emit('generateMosaicView', parsedDataArray);
    },
    selectGame(index, game) {
      this.currentGameIndex = index;
      this.currentActiveGame = game;
      if (this.delay > 0) {
        // game.parsedData.halfMoves.forEach((nextMove) => {
        //   console.log(`Next Move ${nextMove.id}: ${nextMove.color} plays ${nextMove.move} at ${nextMove.time}\n`)
        // })
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
      }
    },
    presentGameWithDelay() {
      const test = getCurrentMove(this.currentActiveGame.parsedData.halfMoves, new Date())
      if (test) {
        let game = clonePGN(this.currentActiveGame.parsedData, test.id)
        this.loadGame(game); // ovo gore treba da ide u startMoveIntervals2
        this.startMoveIntervals(this.currentActiveGame.parsedData)
      }
    },
    startMoveIntervals(parsedData) {
      // Prvo očisti sve postojeće tajmere
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
          const test = getCurrentMove(this.currentActiveGame.parsedData.halfMoves, new Date());
          let game = clonePGN(this.currentActiveGame.parsedData, test.id);

          console.log(`Move ${test.id}: ${move.color} plays ${move.move} at ${move.time}`);
          this.loadGame(game);

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
    async apiGameLoader() {
      if (this.selectedRound) {
        const pgn = await generatePgnForRound(this.tournamentId, this.selectedRound);
        this.games = this.parseMultiplePGNs(pgn);
      }
    }
  },
  // todo: Ako se response API-ja nije promenio nemoj nista raditi. DONE
  // todo: Probati samo neako da se doda sledeci potez u vec postojeci mec bez da se sve ucita ponovo. DONE ali treba jos testirati
  // todo: Da se updejtuju rezultati unutar liste kada se promeni live count u responsu
  async created() {
    await this.fetchRounds();
    await this.apiGameLoader();
    this.intervalId = setInterval(this.fetchActiveGame, 5000);
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
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
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}
.filtered-game-container:hover {
  background-color: #f0f0f0;
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
</style>
