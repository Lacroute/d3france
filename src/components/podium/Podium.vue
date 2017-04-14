<template lang="html">
  <div class="podium">
    <div class="toggle-podium">
      <button :class="{active: mode === 0}" type="button" name="button" @click="switchMode(0)">
        <span class="UI-icon UI-list"></span>
      </button>
      <button :class="{active: mode === 1}" type="button" name="button" @click="switchMode(1)">
        <span class="UI-icon UI-mosaic"></span>
      </button>
    </div>

    <transition-group name="flip-list" tag="div" class="ranking-rows" appear v-if="mode === 0">
      <div class="candidate-slot" v-for="c in ranking.data" :key="c.title">
        <div class="profile">
          <div class="picture">
            <img :src="getImg(c.title)" alt="">
          </div>
          <div class="text">
            <span class="name">{{candidates[c.title].firstname.slice(0,1)}}. {{candidates[c.title].name}}</span>
            <span class="party">{{candidates[c.title].parti}}</span>
          </div>
        </div>
        <div class="score">
          <div class="bar-wrapper">
            <div class="bar" :style="{background: candidates[c.title].color, width: scaleResult(c.percentage)}"></div>
          </div>
          <span class="value percentage" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(c.percentage) }}</span>
          <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(c.voix) }}</span>
        </div>
      </div>
    </transition-group>

    <transition-group name="flip-list" tag="div" class="ranking-square" appear v-else>
      <div class="candidate-slot" v-for="c in ranking.data" :key="c.title">
          <div class="profile">
            <div class="picture">
              <img :src="getImg(c.title)" alt="">
            </div>
            <div class="back-bar" :style="{background: candidates[c.title].color, height: scaleResult(c.percentage)}">
            </div>
          </div>
        <div class="score" :style="{background: candidates[c.title].color}">
          <span v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(c.percentage) }}</span>
          <span class="absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(c.voix) }}</span>
        </div>
      </div>
    </transition-group>
    <participation></participation>
  </div>
</template>

<script>
import { formatSpecifier, format, formatDefaultLocale } from 'd3'
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex'
import { FETCH_CANDIDATES, FETCH_COUNTRY_DETAILS } from 'src/store/action-types'
import { UPDATE_VOTE_DISPLAY } from 'src/store/mutation-types'
import { PODIUM_MODES } from 'utils/constants'
import customLocale from 'utils/localFormats'
let candidatesPicsContext = require.context('assets/img/candidates')
import Participation from './Participation'

export default {
  name: 'Podium',

  components: {Participation},

  data () {
    return {
      interval: null,
      mode: PODIUM_MODES.ROW
    }
  },

  computed: {
    ...mapState({
      candidates: ({results}) => results.candidates,
      voteAsPercents: ({userActions}) => userActions.voteAsPercents
    }),

    ...mapGetters({
      ranking: 'totalization_data_file'
    }),

    scaleFactor () {
      if (this.ranking.data.length === 0 || this.ranking.data[0].percentage === null) return 0
      return 100 / this.ranking.data[0].percentage
    },

    percentFormat () { return format(formatSpecifier('.2%')) },
    numberFormat () { return format(formatSpecifier(',')) }
  },

  created () {
    formatDefaultLocale(customLocale[this.$route.params.lang])
    this.fetchCandidates()
  },

  methods: {
    ...mapActions({
      fetchCandidates: FETCH_CANDIDATES,
      fetchCountry: FETCH_COUNTRY_DETAILS
    }),

    ...mapMutations({
      switchVoteDisplay: UPDATE_VOTE_DISPLAY
    }),


    switchMode (mode) { this.mode = mode },

    scaleResult (percentage) { return `${percentage * this.scaleFactor}%` },

    getImg (idCandidate) {
      return candidatesPicsContext('./' + idCandidate + '.png')
    },

    formatPercents (value) { return this.percentFormat(value / 100) },
    formatNumbers (value) { return this.numberFormat(value) }
  }
}
</script>

<style lang="scss">
@import "~styles/global";
@import "~styles/podium";

.toggle-podium{
  position: absolute;
  right: 0;
  top: 0;
  text-align: right;
  button{
    opacity: .3;
    transition: opacity 750ms ease;
    color: $font-color-main;
    border: none;
    background: none;
    box-shadow: none;
    outline: 0;
  }
  button:hover{
    cursor: pointer;
  }
  button.active{
    opacity: 1;
  }
}
</style>
