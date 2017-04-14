<template lang="html">
  <div id="layout">
    <header>
      <live-indicator></live-indicator>
    </header>

    <section class="body">
      <router-view></router-view>
    </section>

    <footer>
    </footer>

  </div>
</template>

<script>
import LiveIndicator from 'components/LiveIndicator'

export default {
  name: 'Layout',

  components: {LiveIndicator},

  data () {
    return {
      lang: this.$route.params.lang
    }
  },

  methods: {
    test () {
      this.$router.push({ name: this.$route.name, params: { lang: this.lang } })
    }
  }
}
</script>

<style lang="scss">
@import "~styles/global";

#layout{
  padding: 0 0 50px;
  margin: 0 18px;

  h1{
    text-align: left;
    font-size: 1.1em;
    margin:  10px 0 1.1em;
  }
  .info{
    text-align: left;
    font-size: 13px;
    color: $grey-cold-6;
    margin-bottom: 1rem;
  }
}
</style>
