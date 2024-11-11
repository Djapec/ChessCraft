import { defineStore } from 'pinia'

export const useMosaicViewStore = defineStore('mosaicView',{
    state: () => {
        return {
            mosaicViewGameList: null,
        }
    },
    getters: {
        getMosaicViewGameList() {
            return this.mosaicViewGameList;
        },
    },
    actions: {}
})