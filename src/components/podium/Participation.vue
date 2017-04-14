<template>
  <div class="participation-bar">
    <p>{{ $t('participation') }} {{ $t('france') }}
      <span v-if="voteAsPercents">{{ $t('as_a_percentage') }}</span>
      <span v-else>{{ $t('as_a_number') }}</span>
    </p>
    <div class="participation-value">
      <div class="abstention bar" :style="{width: `${abstention.rapportinscrit}%`}"></div>
      <div class="voting bar" :style="{width: `${voting.rapportinscrit}%`}">
        <div class="no-vote bar" :style="{width: `${noVote.rapportvotant}%`}"></div>
      </div>
    </div>
    <div class="legend">
      <p>
        <span class="square abstention"></span>{{ $t('abstention') }}
        <span class="value" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(abstention.rapportinscrit) }}</span>
        <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(abstention.nombre) }}</span>
      </p>
      <p>
        <span class="square voting"></span>{{ $t('voting') }}
        <span class="value" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(voting.rapportinscrit) }}</span>
        <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(voting.nombre) }}</span>
      </p>
      <p>
        <span class="square no-vote"></span>{{ $t('no_vote') }}
        <span class="value" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(noVote.rapportvotant) }}</span>
        <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(noVote.nombre) }}</span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from 'vuex'
import { UPDATE_VOTE_DISPLAY } from 'src/store/mutation-types'
import { formatSpecifier, format, formatDefaultLocale } from 'd3'
import customLocale from 'utils/localFormats'

export default {
  name: 'Participation',

  computed: {
    ...mapState({
      // abstention: ({results}) => results.country.abstention,
      noVote: ({results}) => results.country.noVote,
      voting: ({results}) => results.country.voting,
      voteAsPercents: ({userActions}) => userActions.voteAsPercents
    }),

    ...mapGetters({
      isLoaded: 'isLoaded',
      participation: 'participation_data_file'
    }),

    abstention () {
      if (this.isLoaded) {
        return this.participation.data.find(row => row.key === 'abstention')
      } else {
        return {rapportinscrit: 0}
      }
    },

    voting () {
      if (this.isLoaded) {
        return this.participation.data.find(row => row.key === 'votants')
      } else {
        return {rapportinscrit: 0}
      }
    },

    noVote () {
      if (this.isLoaded) {
        let blanc = this.participation.data.find(row => row.key === 'blancs')
        let nul = this.participation.data.find(row => row.key === 'nuls')
        return {rapportvotant: parseInt(blanc.rapportvotant) + parseInt(nul.rapportvotant)}
      } else {
        return {rapportvotant: 0}
      }
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

    formatPercents (value) { return this.percentFormat(value / 100) },
    formatNumbers (value) { return this.numberFormat(value) }
  }
}
</script>

<style lang="css">
</style>
