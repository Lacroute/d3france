<template lang="html">
  <div class="estimated">
    <transition-group name="flip-list" tag="div" class="ranking-rows" appear v-if="isLoaded">
      <div class="candidate-slot" v-for="c in estimated.data" :key="c.title">
        <div class="profile">
          <div class="picture">
            <img :src="getImg(c.title)" alt="">
          </div>
          <div class="text">
            <span class="name">{{candidates[c.title].firstname.slice(0,1)}}. {{candidates[c.title].name}}</span>
            <span class="party">{{candidates[c.title].parti}}</span>
          </div>
        </div>
        <div class="score estimated">
          <div class="institute-position" v-for="institute in c.estimations" :style="{ left: scaleStart(institute.min), width: scaleWidth(institute.min, institute.max)}">
            <div class="institute-wrapper">
              <span v-if="institute.isMin" class="min">{{formatPercents(institute.min)}}</span>
              <div class="institute" :style="{ background: candidates[c.title].color}"></div>
              <span v-if="institute.isMax" class="max">{{formatPercents(institute.max)}}</span>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
    <div class="participation">
      <div v-for="data in participationEstimated.data" class="participation-wrapper">
        <span class="key">{{$t(data.key)}}</span>
        <p>
          {{$t('between')}}
          <span class="value">{{formatPercents(data.min)}}</span> {{$t('and')}}
          <span class="value">{{formatPercents(data.max)}}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { formatSpecifier, format, formatDefaultLocale } from 'd3'
import { mapState, mapGetters } from 'vuex'
import customLocale from 'utils/localFormats'
let candidatesPicsContext = require.context('assets/img/candidates')

export default {
  name: 'PodiumEstimated',

  computed: {
    ...mapState({
      candidates: ({results}) => results.candidates
    }),

    ...mapGetters({
      isLoaded: 'isLoaded',
      estimated: 'estimated_data_file',
      participationEstimated: 'estimated_participation_data_file'
    }),

    scaleFactor () {
      if (this.estimated.data.length === 0) return 0

      let maxEstimationFinder = (candidate) => {
        let estimations = candidate.estimations
        let maxInstitute = Object.keys(estimations).reduce((a, b) => {
          return estimations[a].max > estimations[b].max ? a : b
        })
        return parseFloat(estimations[maxInstitute].max)
      }

      let estimationMax = maxEstimationFinder(this.estimated.data[0])
      this.estimated.data.reduce((a, b) => {
        let estimationRef = maxEstimationFinder(b)
        if (estimationRef > estimationMax) {
          estimationMax = estimationRef
          return b
        } else {
          return a
        }
      })

      return 100 / estimationMax
    },

    customFormat () {
      return format(formatSpecifier('.2%'))
    }
  },

  created () {
    formatDefaultLocale(customLocale[this.$route.params.lang])
  },

  methods: {
    getImg (idCandidate) {
      return candidatesPicsContext('./' + idCandidate + '.png')
    },

    scaleStart (start) { return `${start * this.scaleFactor}%` },
    scaleWidth (start, end) { return `${(end - start) * this.scaleFactor}%` },
    formatPercents (value) { return this.customFormat(value / 100) }
  }
}
</script>

<style lang="scss">
@import "~styles/global";
@import "~styles/podium";
$margin_span: 10px;
$width_span: 45px;
.estimated{
  .candidate-slot{
    margin-bottom: 1em;
    display: flex;
    align-items: center;
    border-bottom: 1px solid $grey-cold-1;
  }
  .candidate-slot:last-child{
    margin: 0;
  }
  .profile .text{
    font-size: .75em;
    font-weight: 600;
    vertical-align: middle;
    min-width: 115px;
  }

  .score{
    margin: 0 ($margin_span + $width_span) 4px  ($margin_span/2 + $width_span);
    min-height: 15px;
  }

  .score{
    flex-grow:1;
  }

  .participation{
    text-align: left;
    font-family: $roboto_mono;
    font-size: 12px;
    color: $grey-cold-5;
    border-bottom: 1px solid $grey-cold-1;
    padding: 11px 0;

    .participation-wrapper{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      vertical-align: middle;
      p{
        margin: 0;
      }
    }
    .key, .value{
      color: $font-color-main;
    }
    .key{
      font-weight: 600;
      font-family: $source_sans_pro;
      font-size: 14px;
    }
  }
}
.institute-position{
  position: absolute;
  height: 100%;
}
.institute-wrapper{
  position: relative;
  height: 100%;
  width: 100%;
  span.min, span.max{
    display: block;
    position: absolute;
    font-family: $roboto_mono;
    font-size: 11px;
    width: $width_span;
    top: 50%;
    transform: translateY(-50%);
  }
  span.min{
    left: -($margin_span + $width_span);
    text-align: right;
  }
  span.max{
    right: -($margin_span + $width_span);
  }

  .institute{
    height: 100%;
    width: 100%;
    opacity: .33;
    position: absolute;
  }
}
@media #{$break-medium} {
  .estimated{
    .candidate-slot{
      align-items: stretch;
      margin-bottom: 4px;
    }
    .score{
      border: none;
    }
  }
}
</style>
