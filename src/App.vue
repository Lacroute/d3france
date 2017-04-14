<template>
  <div id="app">
    <layout></layout>
    <meta-container></meta-container>
  </div>
</template>

<script>
import Layout from 'components/Layout'
import MetaContainer from 'components/metas/MetaContainer'


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
  @import '~styles/global';

  #app {
    font-family: $source_sans_pro;
    color: $font-color-main;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    position: relative;
    background: $white;
    max-width: 1366px;
    margin: auto;
  }
</style>
