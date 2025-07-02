import { defineStore } from 'pinia'

export const useGameOnTheBoardStore = defineStore('gameOnTheBoard',{
    state: () => {
        return {
            currentGameOnTheBoard: {},
            currentGameOnTheBoardId: null,
            lastPlayedCurrentGameMove: null,
            lastPlayedMoveIndex: 1,
            chessHistoryForEngineAnalyze: [],
            actionType: 'load', //just two possible values: load or update
            clockObject: {}
        }
    },
    getters: {
        getCurrentGameOnTheBoard() {
            return this.currentGameOnTheBoard;
        },
        getHalfMovesForCurrentGameOnTheBoard() {
            return this.currentGameOnTheBoard.halfMoves;
        },
        getChessObjectFromCurrentGameOnTheBoard() {
            return this.currentGameOnTheBoard.chess;
        },
        getChessHistoryForEngineAnalyze() {
            return this.chessHistoryForEngineAnalyze;
        },
        getLastPlayedCurrentGameMove() {
            return this.lastPlayedCurrentGameMove
        },
        getClockObject() {
            return this.clockObject
        }
    },
    actions: {
        setLastPlayedMoveIndex(moveId) {
            console.log(moveId)
        },

        setNewGameOnTheBoard(game) {
            this.lastPlayedMoveIndex = game;
        },

        setNewLastPlayedGameMove(lastGameMove) {
            this.lastPlayedCurrentGameMove = lastGameMove;
        },

        toggleViewOnlyMod(isViewOnly) {
            this.disableMovementAndControls = isViewOnly;
        }
    }
})