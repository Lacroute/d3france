<template>
  <div id="app">
    <layout></layout>
    <meta-container></meta-container>
  </div>
</template>

<script>
import Layout from 'components/Layout'
import MetaContainer from 'components/common/MetaContainer'


export default {
  name: 'app',

  components: {
    Layout,
    MetaContainer
  }
}
</script>

<style src="normalize.css"></style>
<style lang="scss">
  @import '~utils/global';

  #app {
    font-family: $source_sans_pro;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    position: relative;
    background: $white;
  }
</style>
