<template>
  <div class="live-indicator">
    <div class="rec" v-if="!ended">
      <svg :width="svgSide" :height="svgSide">
        <g ref="g" :transform="centerTranslate">
          <circle id="center" cx="0" cy="0" :r="centerRadius"></circle>
          <circle id="border" cx="0" cy="0" :r="borderRadius" :stroke-width="borderWidth"></circle>
        </g>
      </svg>
    </div>
    <div class="description">
      <h2><span v-html="roundDisplay"></span>, {{ $t(status.u.election_status) }}</h2>
      <p>{{nbComm}}% {{ $t('city_count') }}</p>
    </div>
  </div>
</template>

<script>
import { arc, select, interpolate, interval } from 'd3'
import apiVote from 'api/vote'
import { STATUS } from 'api/vote/config'
import { mapGetters } from 'vuex'

export default {
  name: 'LiveIndicator',

  data () {
    return {
      svgSide: 42,
      centerRadius: 8,
      // TODO plus fin
      borderWidth: 2,
      borderRadius: 15,
      arcFunc: null,
      arcElem: null,
      interval: null,
      nbComm: 0,
      intervalWatchCount: 30 // In seconds
    }
  },


  computed: {
    ...mapGetters({
      isLoaded: 'isLoaded',
      status: 'status_data_file',
      round: 'routeRound'
    }),

    ended () {
      if (this.isLoaded) return STATUS[this.status.u.election_status].code >= STATUS.approuved.code
      else return false
    },

    centerTranslate () {
      return 'translate(' + this.svgSide / 2 + ',' + this.svgSide / 2 + ')'
    },

    nbCommAngle () {
      return this.nbComm / 100 * 2 * Math.PI
    },

    roundDisplay () {
      return this.$t(this.round)
    }
  },


  created () {
    this.arcFunc = arc()
    .innerRadius(this.borderRadius - this.borderWidth / 2)
    .outerRadius(this.borderRadius + this.borderWidth / 2)
    .startAngle(0)

    this.watchCounting()
  },


  mounted () {
    this.arcElem = select('g')
    .append('path')
    .datum({endAngle: 0})
    .attr('id', 'progression')
    .attr('d', this.arcFunc)
  },


  beforeDestroy () {
    if (this.interval) this.interval.stop()
  },


  methods: {
    incrementUntil (value) {
      return new Promise((resolve, reject) => {
        const stepTarget = Math.floor(value)
        if (stepTarget === this.nbComm) reject()

        const stepTime = Math.abs(Math.floor(250 / value))
        let timer = setInterval(() => {
          if (this.nbComm < stepTarget) this.nbComm++
          else {
            clearInterval(timer)
            resolve()
          }
        }, stepTime)
      })
    },


    watchCounting () {
      let fetch = _ => {
        apiVote.fetchCounting(this.round).then(count => {
          this.incrementUntil(count)
          .then(
            sucess => {
              // console.log('SUCCESS');
              this.arcElem.transition()
              .duration(750)
              .attrTween('d', this.arcTween())
            },
            reject => {
              // console.log('REJECT');
            }
          )
        })
      }

      fetch()
      this.interval = interval(_ => {
        fetch()
      }, this.intervalWatchCount * 1000)
    },


    // ref: http://bl.ocks.org/mbostock/5100636
    arcTween () {
      return (d) => {
        var itrpl = interpolate(d.endAngle, this.nbCommAngle)
        return (t) => {
          d.endAngle = itrpl(t)
          return this.arcFunc(d)
        }
      }
    }
  }
}
</script>

<style lang="scss">
@import "~styles/global";
$svgSide: 2em;
$diff: 0.15em;

.live-indicator{
  border-top: 4px solid $font-color-main;
  display: flex;
  align-items: center;
  padding: (($svgSide + 1) / 2) 0;

  .description{
    h2, p{
      margin: 0;
      padding: 0;
      text-align: left;
    }

    h2 {font-size: $svgSide / 2 + $diff}
    p {
      font-size: $svgSide / 2 - $diff;
      font-style: italic;
      color: $grey-cold-5;
    }
  }
}
.rec{
  margin: 0 $svgSide * 0.75;

  svg{
    display: block;

    circle#center{
      fill: $red-warm-4;
      animation: recBlink 2000ms step-end infinite ;
    }
    circle#border{
      fill: none;
      stroke: $red-warm-1;
      stroke-linecap: "round"
    }
    path#progression{
      fill: $red-warm-4;
      animation: rotating 10s linear infinite;
    }
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes recBlink {
  from { fill: $red-warm-1; }
  50% { fill: $red-warm-4; }
  to { fill: $red-warm-1; }
}
</style>
