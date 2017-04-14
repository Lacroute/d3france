<template lang="html">
  <div class="participation-context">
    <div class="instruction" v-if="abstention === null">
      <p v-if="isFetching">{{ $t('fetching_data') }}...</p>
    </div>
    <div v-else class="participation-bar">
      <p>{{ $t('participation') }} {{ $t(selected.featureName) }}
        <span v-if="voteAsPercents">{{ $t('as_a_percentage') }}</span>
        <span v-else>{{ $t('as_a_number') }}</span>
      </p>
      <div class="participation-value">
        <div class="abstention bar" :style="{width: `${abstention.percentage}%`}"></div>
        <div class="voting bar" :style="{width: `${voting.percentage}%`}">
          <div class="no-vote bar" :style="{width: `${noVote.percentage}%`}"></div>
        </div>
      </div>
      <div class="legend">
        <p>
          <span class="square abstention"></span>{{ $t('abstention') }}
          <span class="value" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(abstention.percentage) }}</span>
          <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(abstention.absolute) }}</span>
        </p>
        <p>
          <span class="square voting"></span>{{ $t('voting') }}
          <span class="value" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(voting.percentage) }}</span>
          <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(voting.absolute) }}</span>
        </p>
        <p>
          <span class="square no-vote"></span>{{ $t('no_vote') }}
          <span class="value" v-if="voteAsPercents" @click="switchVoteDisplay">{{ formatPercents(noVote.percentage) }}</span>
          <span class="value absolute" v-else @click="switchVoteDisplay">{{ formatNumbers(noVote.absolute) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { UPDATE_VOTE_DISPLAY } from 'src/store/mutation-types'
import { formatSpecifier, format, formatDefaultLocale } from 'd3'
import customLocale from 'utils/localFormats'

export default {
  name: 'ParticipationContext',

  computed: {
    ...mapState({
      selected: ({selection, zoomstate}) => selection.history[zoomstate.currentZoomLevelWeight],
      abstention: ({results}) => results.abstention,
      noVote: ({results}) => results.noVote,
      voting: ({results}) => results.voting,
      isFetching: ({results}) => results.isFetching,
      voteAsPercents: ({userActions}) => userActions.voteAsPercents
    }),

    abstentionDisplay () { return this.abstention ? `${this.abstention}%` : '0%' },

    votingDisplay () { return this.voting ? `${this.voting}%` : '0%' },

    noVoteDisplay () { return this.noVote ? `${this.noVote}%` : '0%' },

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

<style lang="scss" >
@import '~styles/global';
.participation-bar{
  text-align: left;
  >p {
    font-weight: 600;
    span{
      font-weight: 400;
      font-style: italic;
      font-size: 0.80em;
      margin-left: 1em;
      color: $grey-cold-5;
    }
  }

  .participation-value{
    height: 2em;
    display: flex;

    .bar {
      height: 100%;
      transition: width 1000ms ease;
    }
    .no-vote {
      // float: right;
    }
  }

  .legend {
    display: flex;
    justify-content: space-between;
    font-family: $roboto-mono;
    font-size: 10px;

    p + p{
      margin-left: 8px;
    }

    .square, .value {
      display: inline-block;
    }
    .square {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      margin-right: 5px;
    }

    .value{
      font-size: 11px;
    }
    .value.absolute {
      font-size: 10px;
    }
  }
}
.abstention {
  background: $abstention;
}
.voting{
  background: $voting;
}
.no-vote {
  background: $no-vote;
  $stop: 1px;
  background: repeating-radial-gradient(center center, $no-vote, $no-vote $stop, $voting $stop, $voting 100%);
  background-size: 4px 4px;
}

@media #{$break-small} {
  .participation-bar{
    .legend {
      font-size: 11px;
    }
    .value {
      font-size: 13px;
    }
  }
}
@media #{$break-medium} {
  .participation-bar{
    .legend {
      font-size: 12px;
    }
    .square {
      margin-right: 10px;
    }
    .value {
      margin-left: 10px;
      font-size: 15px;
    }
  }
}
</style>
