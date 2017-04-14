<template lang="html">
  <div class="podium-context">
    <div class="table">
      <!-- <div v-if="ranking.length === 0 && isFetching" class="instruction">
        <p>FETCHING DATA...</p>
      </div> -->
      <div v-if="ranking.length === 0 && !isFetching" class="instruction">
        <div>
          <h4>{{ $t(selected.featureName)}}</h4>
          <p>{{$t('no_results_yet')}}</p>
        </div>
      </div>

      <transition-group name="flip-list" tag="div" class="results" appear>
        <div v-for="r in ranking" class="rowResult" :key="r.id">
          <header>{{ candidatDisplayName(r.id) }}</header>
          <div class="score">
            <div class="bar-wrapper">
              <span class="bar" :style="{width: scaleResult(r.percentage), backgroundColor: candidateColor(r.id)}"></span>
            </div>
            <span class="value percentage" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(r.percentage) }}</span>
            <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(r.voix) }}</span>
          </div>
        </div>
      </transition-group>

    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { UPDATE_VOTE_DISPLAY } from 'src/store/mutation-types'
import { formatSpecifier, format, formatDefaultLocale } from 'd3'
import customLocale from 'utils/localFormats'

export default {
  name: 'PodiumContext',

  computed: {
    ...mapState({
      selected: ({selection, zoomstate}) => selection.history[zoomstate.currentZoomLevelWeight],
      history: ({selection}) => selection.history,
      isFetching: ({results}) => results.isFetching,
      ranking: ({results}) => results.ranking,
      voteAsPercents: ({userActions}) => userActions.voteAsPercents,
      candidates: ({results}) => results.candidates
    }),

    selectedGeoId () {
      return this.selected.geoId
    },

    scaleFactor () {
      if (this.ranking.length === 0) return 0
      return 100 / this.ranking[0].percentage
    },

    percentFormat () { return format(formatSpecifier('.2%')) },
    numberFormat () { return format(formatSpecifier(',')) }
  },


  created () {
    formatDefaultLocale(customLocale[this.$route.params.lang])
  },


  methods: {
    ...mapMutations({
      switchVoteDisplay: UPDATE_VOTE_DISPLAY
    }),

    candidatDisplayName (id) {
      let p = this.candidates[id]
      return `${p.firstname} ${p.name}`
    },

    scaleResult (percentage) { return `${percentage * this.scaleFactor}%` },

    candidateColor (id) {
      try {
        return this.candidates[id].color
      } catch (e) {
        console.error(`Candidate ${id} not found.`)
      }
    },

    formatPercents (value) { return this.percentFormat(value / 100) },
    formatNumbers (value) { return this.numberFormat(value) }
  }
}
</script>

<style lang="scss">
@import "~styles/global";
@import "~styles/podium";
.podium-context{
  // background: red;
  margin-top: $height_flag_bar;

  .table {
    position: relative;
    height: 100%;
    min-height: 150px;
  }

  .instruction {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, .75);

    h4, p{
      margin: 0;
    }
    h4 {
      font-size: 1.5em;
      margin-bottom: 1em;
    }
  }

  .results {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  .rowResult {
    header {
      text-align: left;
      font-weight: 600;
      font-size: 0.9em;
      letter-spacing: -0.025em;
    }
  }

  @media #{$break-medium} {
    .table {
      margin-left: 18px;
    }
  }
}
</style>
