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
            :class="{ 'focused': game.id === currentActiveGame?.id && !isMosaicViewEnabled }"
            class="game-round"
            @click="isMosaicViewEnabled ? addGameToMosaicView(index, game) : selectGame(index, game)"
        >
          <input
              type="checkbox"
              v-if="isMosaicViewEnabled"
              name="mosaic-view-option"
              class="mosaic-view-selection-checkbox"
              :disabled="mosaicViewGamesIndices.length >= 4 && mosaicViewGamesIndices.findIndex(x => x.id === game.id) === -1"
              :checked="mosaicViewGamesIndices.some(x => x.id === game.id)"
          >
          <div class="filtered-game-container">
            <span class="game-index">{{ index + 1 }}.</span>
            <span class="game-name">{{ formatPlayerInfo(game.name) }}</span>
            <span class="game-result">{{ game.result }}</span> <!--nadji nacin da popravis ovo this.checkGameResult(game)-->
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import bus from "../../bus";
import {
  fetchGames,
  fetchTournament, formatPlayerInfo,
  generatePgn,
  getCurrentMoveScheduledByTime,
  isToday,
  isTwentyMinutesLater,
  parseTimeToDate,
  partlyClonePgn,
  validateRoundNumber
} from "../../utils/util";
import {parsePgnWithDelay} from "../../pgn-parser/pgnParserWithDelay";
import {mapStores} from "pinia";
import {useGameOnTheBoardStore} from "../../store/currentGameStore";
import {generatePairObject, getPairsForRound} from "../../api/getPairs";

export default {
  name: 'gameSelectionManager',
  inject: ['config'],
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
      startTournamentTime: new Date(new Date().setHours(15, 45, 0, 0)),
      timeoutIds: []
    };
  },
  computed: {
    tournamentId() {
      if(this.$route.params.id) {
        return this.$route.params.id
      }
      return '0435bbba78625-eb8b4-eac43-e5442-91bf534c1';
    },
    filteredGames() {
      return this.games.filter(game => game.name.toLowerCase().includes(this.search.toLowerCase()));
    },
    routeRound() {
      return Number(this.$route.params.roundNumber)
    },
    ...mapStores(useGameOnTheBoardStore),
  },
  watch: {
    selectedRound: 'generatePgnForActiveRound'
  },
  methods: {
    formatPlayerInfo,
    /**
     * Trigger fetchActiveRound method when user comeback to the page again
     */
    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        this.fetchActiveRound()
      }
    },

    /**
     * Fetching tournament and initializes the rounds number.
     */
    async initializeRoundsForTournament() {
      try {
        const tournament = await fetchTournament(this.tournamentId);
        let roundsNumber = tournament.rounds.length;
        this.initializeRounds(roundsNumber)
      } catch (error) {
        console.error("Error fetching rounds: ", error);
      }
    },

    /**
     * Initializes the rounds array and sets the selected round based on the route round.
     * @param {number} roundsNumber - The total number of rounds to generate.
     * @returns {Object} - An object containing the rounds array and the selected round.
     */
    initializeRounds(roundsNumber) {
      this.rounds = Array.from({ length: roundsNumber }, (_, i) => i + 1);
      this.selectedRound = this.rounds.includes(this.routeRound) ? this.routeRound : this.rounds[0];
    },

    /**
     * Parses the content of a PGN file, extracting individual games and metadata for each game.
     * @param {string} fileContent - The raw content of the PGN file.
     * @returns {Array<Object>} - An array of parsed game objects.
     */
    parsePgnFile(fileContent) {
      const pgns = fileContent.split(/\n\n(?=\[)/);
      return pgns.map(pgn => this.processPgnEntry(pgn));
    },

    /**
     * Processes a single PGN entry, parsing metadata and generating game information.
     * @param {string} pgn - The PGN string for a single game.
     * @returns {Object} - The parsed game object with metadata, result, game history...
     */
    processPgnEntry(pgn) {
      const parsedData = parsePgnWithDelay(pgn, this.startTournamentTime, this.delay);
      const { gameName, result } = this.getGameMetadata(parsedData);
      const id = `${this.selectedRound}-${gameName}`;

      return {
        id: id,
        pgn: pgn,
        name: gameName,
        result: result,
        parsedData: parsedData,
      };
    },

    /**
     * Retrieves the metadata for a parsed PGN entry, including player names and result.
     * @param {Object} parsedData - The parsed PGN data.
     * @returns {Object} - An object containing the game name and result.
     */
    getGameMetadata(parsedData) {
      const whitePlayer = parsedData.metadata.White || "Unknown";
      const blackPlayer = parsedData.metadata.Black || "Unknown";
      const result = parsedData.metadata.Result || "N/A";
      const gameName = `${whitePlayer} - ${blackPlayer}`;

      return { gameName, result };
    },

    /**
     * Selects a game, updates the current game state, disables movement controls,
     * and manages game fetching or loading based on game result.
     * @param {number} index - The index of the selected game.
     * @param {Object} game - The game object to select.
     */
    async selectGame(index, game) {
      const parsedData = await this.fetchGameById(index) // ovde mora da ide ID
      if (parsedData) {
        this.updateCurrentGameState(game, index, parsedData);
        bus.$emit('disableMovementAndControlsWhenChangingGame');

        const gameResult = this.checkGameResult(this.currentActiveGame);
        if (gameResult === '*') {
          this.presentGameBasedOnDelay();
        } else {
          this.loadSelectedGame(this.currentActiveGame);
        }
      }
    },

    async updateCurrentSelectedGameAfter(index, game) {
      const parsedData = await this.fetchGameById(index)
      if (parsedData) {
        this.updateCurrentGameState(game, index, parsedData);

        const gameResult = this.checkGameResult(this.currentActiveGame);
        if (gameResult === '*') {
          this.presentGameBasedOnDelay();
        } else {
          this.loadSelectedGame(this.currentActiveGame);
        }
      }
    },

    /**
     * Presents the game with or without delay based on the current delay setting.
     */
    presentGameBasedOnDelay() {
      if (this.delay > 0) {
        this.clearAllTimeouts();
        this.presentAndScrapeGameWithDelayedMove();
      } else {
        this.startActiveGameFetch();
      }
    },

    /**
     * Starts the active game fetch interval and immediately fetches the active game.
     */
    startActiveGameFetch() {
      clearInterval(this.intervalActiveGameFetch);
      this.intervalActiveGameFetch = setInterval(this.fetchActiveGame, 5000);
      this.fetchActiveGame();
    },

    /**
     * Loads the selected game and updates the previous game ID.
     * @param {Object} game - The game object to load.
     */
    loadSelectedGame(game) {
      this.updateGameState(game.parsedData, 'load');
      this.previousGameId = this.currentGameId;
    },

    /**
     * Updates the current game state
     * @param {number} index - The index of the selected game.
     * @param {Object} game - The game object to select.
     * @param parsedData
     */
    updateCurrentGameState(game, index, parsedData) {
      this.currentGameIndex = index;
      this.currentGameId = game.id
      this.currentActiveGame = parsedData;
    },

    // mosaic view game mod

    /**
     * Toggle visibility of analysis board or mosaic view.
     */
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

    /**
     * Adds or removes a game to the mosaic view, manages game intervals, and adjusts the analysis board visibility.
     * @param {number} index - The index of the game in the full game list.
     * @param {Object} game - The game object containing parsed data.
     */
    addGameToMosaicView(index, game) {
      // Clear the previous game state
      this.resetPreviousGame();

      const currentCount = this.getArrayLength(this.mosaicViewGamesIndices);
      const gameIndexInMosaic = this.getGameIndexInMosaic(game.id);

      if (this.shouldAddGameToMosaic(currentCount, gameIndexInMosaic)) {
        this.addGame(index, game);
      } else if (gameIndexInMosaic > -1) {
        this.removeGame(gameIndexInMosaic);
      }

      this.handleMosaicViewState(currentCount, gameIndexInMosaic);
    },

    /**
     * Resets previous game-related data and clears the clock interval.
     */
    resetPreviousGame() {
      this.previousGameId = null;
      // clearClockTimeoutInterval(); // Uncomment if needed
    },

    /**
     * Retrieves the index of a game in the mosaic view list by game ID.
     * @param {string} gameId - The ID of the game to find.
     * @returns {number} - The index of the game in `mosaicViewGamesIndices` or -1 if not found.
     */
    getGameIndexInMosaic(gameId) {
      return this.mosaicViewGamesIndices.findIndex(x => x.id === gameId);
    },

    /**
     * Determines if a game should be added to the mosaic view based on count and game index.
     * @param {number} count - The current count of games in the mosaic view.
     * @param {number} gameIndex - The index of the game in the mosaic view list.
     * @returns {boolean} - True if the game should be added, false otherwise.
     */
    shouldAddGameToMosaic(count, gameIndex) {
      return count < 4 && gameIndex === -1;
    },

    /**
     * Adds a game to the mosaic view list.
     * @param {number} index - The index of the game in the full game list.
     * @param {Object} game - The game object containing parsed data.
     */
    addGame(index, game) {
      this.mosaicViewGamesIndices.push({ id: game.id, gameIndex: index, result: game.result });
    },

    /**
     * Removes a game from the mosaic view list.
     * @param {number} gameIndex - The index of the game in `mosaicViewGamesIndices` to remove.
     */
    removeGame(gameIndex) {
      this.mosaicViewGamesIndices.splice(gameIndex, 1);
    },

    /**
     * Manages the mosaic view state based on game count and index in mosaic view.
     * @param {number} count - The current count of games in the mosaic view.
     * @param {number} gameIndexInMosaic - The index of the game in the mosaic view list.
     */
    handleMosaicViewState(count, gameIndexInMosaic) {
      if (count === 1 && gameIndexInMosaic !== -1) {
        this.toggleMosaicViewEnabled();
        clearInterval(this.intervalActiveMosaicViewGamesFetch);
      } else if (this.shouldUpdateMosaicView(count, gameIndexInMosaic)) {
        this.updateMosaicView();
      }
    },

    /**
     * Determines if the mosaic view should be updated.
     * @param {number} count - The current count of games in the mosaic view.
     * @param {number} gameIndex - The index of the game in the mosaic view list.
     * @returns {boolean} - True if the mosaic view should be updated, false otherwise.
     */
    shouldUpdateMosaicView(count, gameIndex) {
      return (count < 4 && gameIndex === -1) || (count <= 4 && gameIndex > -1);
    },

    /**
     * Updates the mosaic view, manages intervals, and toggles board visibility.
     */
    updateMosaicView() {
      bus.$emit('toggleAnalysisBoardVisibility', false);
      this.sendParsedGamesToMosaicView();
      clearInterval(this.intervalActiveMosaicViewGamesFetch);
      this.intervalActiveMosaicViewGamesFetch = setInterval(this.fetchActiveMosaicViewGames, 5000);
    },

    /**
     * Calculate and return length for mosaicViewGamesIndices array
     */
    getArrayLength(array) { // todo: there has to be a better way than this!
      let count = 0;
      for (const item of array) {
        count++;
      }

      return count;
    },

    /**
     * Collects parsed game data and sends it to the mosaic view.
     */
    sendParsedGamesToMosaicView() {
      this.updateActiveMosaicViewGames()
      //const mosaicViewGameList = this.getParsedGamesForMosaicView();
      //bus.$emit('generateMosaicView', mosaicViewGameList);
    },

    /**
     * Finds a game by its ID in the filtered games list.
     * @param {string} gameId - The ID of the game to find.
     * @returns {Object|undefined} - The game object if found, otherwise undefined.
     */
    findFilteredGameById(gameId) {
      return this.filteredGames.find(game => game.id === gameId)
    },

    /**
     * Fetch and updates existing mosaic view games for live mod
     */
    async fetchActiveMosaicViewGames() {
      const isMosaicViewGameActiveForLiveMod = this.delay === 0 && this.mosaicViewGamesIndices.length >= 1
      const isSomeGameActive = this.mosaicViewGamesIndices.find(game => game.result !== "*")
      if (isMosaicViewGameActiveForLiveMod && !isSomeGameActive) {
        await this.updateActiveMosaicViewGames()
      } else {
        clearInterval(this.intervalActiveMosaicViewGamesFetch);
      }
    },

    /**
     * Updates existing mosaic view games
     */
    async updateActiveMosaicViewGames() {
      const updatableMosaicViewGames = this.mosaicViewGamesIndices.map(game => game.gameIndex + 1);

      // todo: update only result active games
      if (updatableMosaicViewGames.length > 1) {
        const pgn = await this.fetchMosaicViewGameById(updatableMosaicViewGames.join(','))
        if (pgn) {
          this.updateMosaicViewGames(pgn)
        }
      }
    },

    /**
     * Updates mosaic view games by parsing the PGN file and syncing with existing games.
     * @param {string} pgn - The PGN file content to parse.
     */
    updateMosaicViewGames(pgn) {
      if (!pgn) return;

      const parsedDataArray = this.getUpdatedGamesFromPgn(pgn);
      this.emitMosaicViewUpdate(parsedDataArray);
    },

    /**
     * Parses the PGN content and updates the `games` array with parsed data.
     * @param {string} pgn - The PGN file content to parse.
     * @returns {Array<Object>} - An array of parsed data objects for mosaic view games.
     */
    getUpdatedGamesFromPgn(pgn) {
      const parsedDataArray = [];
      const parsedGames = this.parsePgnFile(pgn);

      parsedGames.forEach(parsedGame => {
        const gameIndex = this.findGameIndexByName(parsedGame.name);
        if (gameIndex !== -1) {
          this.updateGameAtIndex(gameIndex, parsedGame);
          parsedDataArray.push(this.games[gameIndex].parsedData); //todo: ovde pedja
        }
      });

      return parsedDataArray;
    },

    /**
     * Finds the index of a game in the `games` array by name.
     * @param {string} gameName - The name of the game to find.
     * @returns {number} - The index of the game in the array, or -1 if not found.
     */
    findGameIndexByName(gameName) {
      return this.games.findIndex(game => game.name === gameName);
    },

    /**
     * Updates a game at a specific index in the `games` array.
     * @param {number} index - The index of the game to update.
     * @param {Object} newGameData - The new game data to insert.
     */
    updateGameAtIndex(index, newGameData) {
      this.games[index] = newGameData;
    },

    /**
     * Emits an event to update the mosaic view with the provided parsed data array.
     * @param {Array<Object>} parsedDataArray - An array of parsed game data for the mosaic view.
     */
    emitMosaicViewUpdate(parsedDataArray) {
      bus.$emit('generateMosaicView', parsedDataArray);
    },

    // single game mod

    /**
     * Pulls data from the server for the game that is currently displayed on the board and, depending on the conditions,
     * will display the game or will constantly update it if the result is still active.
     */
    async fetchActiveGame() {
      if (this.currentGameIndex !== null && this.currentActiveGame.result === '*' && this.delay === 0) {
        try {
          const chessGame = await this.fetchGameById(this.currentGameIndex)
          this.updateOrLoadCurrentActiveGame(chessGame)
        } catch (error) {
          throw new Error(error);
        }
      } else {
        clearInterval(this.intervalActiveGameFetch);
      }
    },

    async fetchMosaicViewGameById(mosaicViewGameList) {
      const round = validateRoundNumber(this.selectedRound);
      const result = await fetchGames(this.tournamentId, round, mosaicViewGameList);
      if (result) {

        return generatePgn(
            result.tournament,
            result.pairsData,
            result.gamesData,
            result.extendedGamesUrls,
            result.lookupMap
        )
      }
    },

    async fetchGameById(index) {
      const round = validateRoundNumber(this.selectedRound);
      const game = validateRoundNumber(index + 1);
      const result = await fetchGames(this.tournamentId, round, game);
      if (result) {

        if (this.delay > 0) {
          this.games = result.pairsData[0].pairings.map(pair => generatePairObject(pair, round))
        }

        const pgn = generatePgn(
            result.tournament,
            result.pairsData,
            result.gamesData,
            result.extendedGamesUrls,
            result.lookupMap
        );

        return this.parsePgnFile(pgn)[0]
      }
    },

    /**
     * Checks the result of a game and determines if it should be considered in progress based on specific conditions.
     * @param {Object} game - The game object to check, containing result and parsed data.
     * @returns {string} - The game result or '*' if the game is in progress under certain conditions.
     */
    checkGameResult(game) {
      if (this.isGameOngoingWithDelay(game)) {
        const partlyClonedGame = this.getPartlyClonedGame(game);
        if (!partlyClonedGame) return game.result;

        return this.shouldUpdateResult(partlyClonedGame, game) ? game.result : '*';
      }
      return game.result;
    },

    checkGameResultForGameById(game) {
      if (this.isGameOngoingWithDelay(game)) {
        const partlyClonedGame = this.getPartlyClonedGame(game);
        if (!partlyClonedGame) return game.result;

        return this.shouldUpdateResult(partlyClonedGame, game) ? game.result : '*';
      }
      return game.result;
    },

    /**
     * Determines if the game is ongoing, has delay, and was started today.
     * @param {Object} game - The game object to check.
     * @returns {boolean} - True if the game is ongoing with delay and started today, false otherwise.
     */
    isGameOngoingWithDelay(game) {
      return (
          game.result !== '*' &&
          this.delay > 0 &&
          game.parsedData.halfMoves.length > 0 &&
          isToday(game.parsedData.metadata?.StartTime)
      );
    },

    /**
     * Checks if the result should be updated based on half-moves and elapsed time.
     * @param {Object} partlyClonedGame - The partly cloned game object.
     * @param {Object} game - The original game object.
     * @returns {boolean} - True if the result should be updated, false if it should stay '*'.
     */
    shouldUpdateResult(partlyClonedGame, game) {
      const isHalfMovesEqual = partlyClonedGame.halfMoves.length === game.parsedData.halfMoves.length;
      const lastMoveTime = partlyClonedGame.halfMoves[partlyClonedGame.halfMoves.length - 1].time;
      const isTwentyMinutesPassed = isTwentyMinutesLater(lastMoveTime);

      return isHalfMovesEqual && isTwentyMinutesPassed;
    },

    /**
     * Scraping chess game by a certain move calculated with a delay and add game to mosaic view
     * @param {Object} game - The game that should be scraped.
     */
    getPartlyClonedGame(game) {
      if (game.parsedData != null) {
        const moveScheduledByTime = getCurrentMoveScheduledByTime(game.parsedData.halfMoves, new Date());
        if (!moveScheduledByTime) {
          return null;
        }
        let moveId = moveScheduledByTime ? moveScheduledByTime.id : 0;
        return partlyClonePgn(game.parsedData, moveId);
      }
    },

    /**
     * Present and scrap chess game by a certain move calculated with a delay
     */
    presentAndScrapeGameWithDelayedMove() {
      const moveScheduledByTime = getCurrentMoveScheduledByTime(this.currentActiveGame.parsedData.halfMoves, new Date());
      let moveId = moveScheduledByTime ? moveScheduledByTime.id : 0;
      let partlyClonedGame = partlyClonePgn(this.currentActiveGame.parsedData, moveId);
      this.updateGameState(partlyClonedGame, 'load');

      if (moveScheduledByTime) {
        this.startMoveIntervals(this.currentActiveGame.parsedData);
      }
    },

    /**
     * It uses a web worker to determine which move should be displayed next depending on the delay,
     * then it will create a partial object and display it.
     */
    startMoveIntervals(parsedData) {
      this.clearAllTimeouts();
      const now = new Date();

      const futureMoves = parsedData.halfMoves.filter(move => {
        const targetTime = parseTimeToDate(move.time);
        return targetTime > now;
      });

      if (futureMoves.length === 0) {
        //console.log("Svi potezi su već prošli.");
        this.updateGameState(parsedData, 'load');
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

          //console.log(`Move ${moveScheduledByTime.id}: ${move.color} plays ${move.move} at ${move.time}`);
          this.updateGameState(partlyClonedGame, 'update');

          scheduleNextMove(moves, index + 1);
        }, delay);

        this.timeoutIds.push(timeoutId);
      };

      scheduleNextMove(futureMoves, 0);
      const nextMove = futureMoves[0];
      //console.log(`Next Move ${nextMove.id}: ${nextMove.color} plays ${nextMove.move} at ${nextMove.time}`);
    },

    /**
     * Stop all execution in the workers threads as soon as possible
     */
    clearAllTimeouts() {
      this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
      this.timeoutIds = [];
    },

    /**
     * Update game list, replace certain game with current one
     */
    updateGameList(newGameData) {
      const index = this.currentGameIndex;
      if (index >= 0 && index < this.games.length) {
        this.games[index] = newGameData;
      }
    },

    /**
     * Loads the active game from the provided PGN data, updates the game list, and updates or loads the game.
     * @param {string} chessGame - The PGN (Portable Game Notation) data for the game to load.
     */
    updateOrLoadCurrentActiveGame(chessGame) {
      this.currentActiveGame = chessGame
      this.updateGameList(this.currentActiveGame);
      const actionType = this.previousGameId === this.currentGameId ? 'update' : 'load';
      this.previousGameId = this.currentGameId
      this.updateGameState(this.currentActiveGame.parsedData, actionType);
    },

    /**
     * Updates the game on the store with new data and sets the appropriate action type.
     *
     * @param {Object} parsedData - The game data to be set on the board.
     * @param {string} actionType - The type of action indicating what was updated, e.g., 'update' or 'load'.
     */
    updateGameState(parsedData, actionType) {
      this.gameOnTheBoardStore.currentGameOnTheBoard = parsedData;
      this.gameOnTheBoardStore.actionType = actionType;
    },

    /**
     * Pulls data from the server for all games within the selected round, then generates and parses the PGN file.
     */
    async generatePgnForActiveRound() { //todo: refactor this someday :D
      if (this.selectedRound) {
        clearInterval(this.intervalActiveRoundFetch);
        this.intervalActiveRoundFetch =
            setInterval(this.fetchActiveRound, this.delay - 1 <= 0 ? 900000 : ((this.delay * 0.6) * 60000));
        const pairings = await getPairsForRound(this.tournamentId, this.selectedRound);
        if (pairings !== null) {
          this.games = pairings;
          if (this.mosaicViewGamesIndices.length > 1) {
            this.sendParsedGamesToMosaicView()
          } else if (this.delay > 0 && this.currentActiveGame) {
            await this.updateCurrentSelectedGameAfter(this.currentGameIndex, this.currentActiveGame)
            this.updateGameState(this.currentActiveGame, 'load');
            if (this.currentActiveGame) {
              this.clearAllTimeouts()
              this.presentAndScrapeGameWithDelayedMove()
            }
          }
        }
        else
          this.games = [];
      }
    },

    /**
     * Fetch selected round if there is unfinished games
     */
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
    await this.initializeRoundsForTournament();
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
  max-height: 200px;
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
  font-size: 12px;
}

.game-name {
  flex-grow: 1;
  text-align: left;
  font-size: 13px;
  color: #333;
}

.game-result {
  width: 60px;
  text-align: right;
  font-weight: 400;
  font-size: 12px;
  color: #555;
}

.games-list li.focused {
  background-color: #f0f0f0;
}

.games-list li:hover {
  background-color: #f0f0f0;
}
</style>

