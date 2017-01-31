<template lang="html">
  <div class="layout">
    <header>
      <ul class="three">
        <li><router-link :to="{name: 'canvas'}">Canvas</router-link></li>
        <!-- <li><router-link :to="{name: 'svg'}">Svg</router-link></li> -->
      </ul>
    </header>

    <section class="body">
      <router-view></router-view>
    </section>

    <footer>

    </footer>

  </div>
</template>

<script>

export default {
  name: 'Layout',

  data () {
    return {
      lang: this.$route.params.lang
    }
  },

  methods: {
    test () {
      this.$router.push({ name: this.$route.name, params: { lang: this.lang }})
    }
  }
}
</script>

<style lang="scss" scoped>
.layout{
  padding: 60px 0 20px;
}

section.body{
  margin-top: 40px
}

.three {
  list-style: none;
  margin: 0 10px;
  padding: 0;
  display: inline-block;

  li {
    display: inline-block;
  }

  li + li {
    margin-left: 10px;
  }

}
.lang-selector{
  display: inline-block;
}
</style>
