<template lang="html">
  <div class="podium-container">
    <h1>{{ $t(electionStatus.t) }}</h1>
    <p class="info">{{$t(status.u.podium_explanation)}}</p>
    <podium v-if="currentMode.code === modes.real.code"></podium>
    <podium-estimated v-if="currentMode.code === modes.estimated.code"></podium-estimated>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { FETCH_COUNTRY_DETAILS } from 'src/store/action-types'
import Podium from 'components/podium/Podium'
import PodiumEstimated from 'components/podium/PodiumEstimated'
import { PODIUM_DATA_MODE, PODIUM_FETCH_INTERVAL } from 'utils/constants'
import { STATUS } from 'api/vote/config'

export default {
  name: 'PodiumContainer',

  components: {Podium, PodiumEstimated},

  data () {
    return {
      modes: PODIUM_DATA_MODE,
      intervalId: null
    }
  },

  watch: {
    isLoaded () {
      window.scrollTo(0, 0)
      this.regularUpdate()
    }
  },

  computed: {
    ...mapGetters({
      isLoaded: 'isLoaded',
      status: 'status_data_file'
    }),

    currentMode () {
      if (this.isLoaded) return this.modes[this.status.u.podium_data_mode]
      else return PODIUM_DATA_MODE.default
    },

    electionStatus () {
      if (this.isLoaded && this.currentMode.code === PODIUM_DATA_MODE.real.code) {
        return STATUS[this.status.u.election_status]
      } else if (this.isLoaded) {
        return this.currentMode
      } else return STATUS.default
    }
  },

  methods: {
    ...mapActions({
      fetchCountryDetails: FETCH_COUNTRY_DETAILS
    }),

    regularUpdate () {
      if (this.intervalId) clearInterval(this.intervalId)

      this.intervalId = setInterval(_ => {
        console.log('UPDATE')
        this.fetchCountryDetails()
      }, PODIUM_FETCH_INTERVAL * 1000)
    }
  }
}
</script>

<style lang="css">
.podium-container{
  position: relative;
}
.ranking-rows{
  padding-top: 10px;
}
</style>
