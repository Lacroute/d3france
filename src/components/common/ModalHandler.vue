<template lang="html">
  <div class="modal-handler" :style="{minWidth: minWidth + 'px'}">

    <!-- Splash screen during loading -->
    <transition name="fade">
      <modal v-if="!isLoaded">
        <div slot="header" class="loader-animation">
          <svg class="circular" viewBox="25 25 50 50">
            <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>
          </svg>
        </div>
        <h2 slot="body">{{ $t('loading') }}</h2>
      </modal>
    </transition>

    <!-- Splash screen when it's too small -->
    <transition name="fade">
      <modal v-if="tooSmall">
        <h1 slot="header">{{ $t('warn_too_small') }}</h1>
        <h1 slot="body">{{ $t('warn_too_small_tips') }}</h1>
      </modal>
    </transition>

    <!-- Splash screen when it's an outdated browser -->
    <transition name="fade">
      <modal v-if="tooOld && !aborted">
        <h1 slot="header">{{ $t('warn_obsolete') }}</h1>
        <h1 slot="body">{{ $t('warn_obsolete_tips') + ' ' + browserDisplayName }}</h1>
        <button slot="footer" @click="abort()">{{ $t('warn_obsolete_continue') }}</button>
      </modal>
    </transition>

  </div>
</template>

<script>
import Modal from 'components/common/Modal'
import { mapGetters } from 'vuex'
import * as supported from 'utils/supported'
import supportedMap from 'utils/supportedMap'

export default {
  name: 'ModalHandler',

  components: {
    Modal
  },

  data () {
    return {
      minWidth: 300,
      windowWidth: Infinity,
      aborted: false
    }
  },

  computed: {
    ...mapGetters({
      isLoaded: 'isLoaded'
    }),

    tooSmall () {
      return this.windowWidth < this.minWidth
    },

    // http://stackoverflow.com/a/16938481/3759551
    browser () {
      let ua = navigator.userAgent
      let tem
      let M = ua.match(/(edge)\/?\s*(\d+)/i)
      if(M !== null){
        return {
          name: M[0].toLowerCase(),
          version: M[1]
        }
      }
      M = ua.match(/(opera|edge|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      if(/trident/i.test(M[1])){
        tem=/\brv[ :]+(\d+)/g.exec(ua) || [];
        return {name:'msie',version:(tem[1]||'')};
      }
      if(M[1]==='Chrome'){
        tem = ua.match(/\bOPR|Edge\/(\d+)/)
        if(tem!=null)   {return {name:'Opera', version:tem[1]};}
      }
      M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
      if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
      return {
        name: M[0].toLowerCase(),
        version: M[1]
      }
    },

    browserDisplayName () {
      return supportedMap[this.browser.name]
    },

    tooOld () {
      return this.minSupported > this.browser.version || this.minSupported === -Infinity
    },

    minSupported () {
      return Math.min.apply(Math, supported.BROWSERLIST[this.browser.name])
    }
  },

  mounted () {
    this.$nextTick(function() {
      window.addEventListener('resize', this.getWindowWidth);
      this.getWindowWidth()
    })
  },

  methods: {
    getWindowWidth (event) {
      this.windowWidth = document.documentElement.clientWidth;
    },

    abort () {
      this.aborted = true
    }
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.getWindowWidth);
  }
}
</script>

<style lang="scss">

</style>
