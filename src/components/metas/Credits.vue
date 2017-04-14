<template lang="html">
  <transition name="modal">
    <section v-if="show">
      <div class="container-close">
        <button @click="show = !show">
          <s class="UI-icon UI-close-alt"></s>
        </button>
      </div>
      <div class="container">

        <article>
          <h2>{{ $t('last_update') }}</h2>
          <p>{{ lastUpdate }}</p>
        </article>

        <article v-if="about">
          <h2>{{ $t('about') }}</h2>
          <p>{{ about }}</p>
        </article>

        <article v-if="sources">
          <h2>{{ $t('sources') }}</h2>
          <p>{{ sources }}</p>
        </article>

        <article>
          <ul  class="who">
            <li v-for="entry in who">
              <h2>{{ $t(entry[0]) }}</h2>
              <span v-for="person, i in entry[1]">
                <a :href="twitterUrl(person.username)" target="_blank">
                  {{ person.name }}
                </a>
                <span v-if="i < (entry[1].length - 1)">, </span>
              </span>
            </li>
          </ul>
        </article>

        <article>
          <a href="https://twitter.com/AFPgraphics" target="_blank" class="follow">
            <img src="~assets/img/twitter-icon.svg" alt="tw" /> @AFPGraphics
          </a>
        </article>
      </div>
    </section>
  </transition>
</template>

<script>
import eventEmitter from 'emitter'
import { mapGetters } from 'vuex'

export default {

  data () {
    return {
      show: false
    }
  },

  computed: {
    ...mapGetters({
      commons: 'commons_data_file'
    }),

    lastUpdate () {
      let val = this.getByKey('last_update')
      var options = {year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'}
      return new Date(val).toLocaleString(this.$route.params.lang, options)
    },
    about () { return this.getByKey('about') },
    sources () { return this.getByKey('sources') },
    who () { return this.getByKey('who') }
  },

  created () {
    eventEmitter.$on('toggle-credits', this.toggle)
    document.addEventListener('keydown', (e) => {
      if (this.show && e.keyCode === 27) {
        this.show = false
      }
    })
  },

  methods: {
    getByKey (key) {
      if (!this.commons.data) return
      let row = this.commons.data.find(row => row.title === key)
      if (!row) return
      if (row.value !== 'nested') return row.value
      row = Object.entries(row).filter(entry => {
        if (!entry[1]) return
        entry[0] = entry[0].replace('.', '_')
        entry[1] = entry[1].split(', ').map(person => {
          let identity = person.split(' @')
          person = { name: identity[0] }
          person.username = identity[1] === undefined ? null : identity[1]
          return person
        })
        return entry[0] !== 'title' && entry[0] !== 'value'
      })

      return row
    },

    twitterUrl (username) {
      if (!username) return
      return 'https://www.twitter.com/' + username
    },

    toggle () {
      this.show = !this.show
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~styles/fonts';
@import '~styles/metas';

section{
  @include themeColors('light');
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.25);
  display: block;
  position: absolute;
  height: auto;
  max-width: 300px;
  left: 0;
  right: 0;
  bottom: 50px;
  padding: $modal_padding;
  transition: opacity .4s ease;
  z-index: 1;

  .container-close{
    position: relative;

    button{
      @extend %reset-button;
      position: absolute;
      top: -$modal_padding/2;
      right: -$modal_padding/2;
      color: inherit;

      s{
        font-size: $close_size;
        color: $loading_color;
        transition: color .3s ease;
      }
      s:hover{
        color: inherit;
      }
    }
  }

  article{
    text-align: left;
    font-family: $source_sans_pro;
  }
  article + article{
    margin-top: $modal_padding;
  }

  // Handle the close button overlay
  article:first-child{
    margin-right: $close_size + 0.5em;

    h2, p{
      display: inline-block;
    }
    h2 {
      margin: $margin_inline;
    }
  }

  h2 {
    margin: 7px 0;
    text-transform: uppercase;
    font-size: 1em;
    font-weight: 600;
  }

  p, li a{
    margin: 0;
    font-size: 0.95em;
  }

  .who{
    list-style: none;
    margin: 0;
    padding: 0;
    li{
      margin: 7px 0;
    }
    h2{
      margin: $margin_inline;
    }
    h2, a{
      display: inline-block;
      text-transform: none;
    }
  }

  a[href]{
    text-decoration: underline;
    color: #4099FF;
  }

  .follow img {
    display: inline-block;
    max-width: 1.3em;
    vertical-align: middle;
    margin-right: 5px;
  }
}

@keyframes slideInLeft {
  from {
    transform: translate3d(-100%, 0, 0);
    visibility: visible;
  }

  to {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes slideOutLeft {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    visibility: hidden;
    transform: translate3d(-100%, 0, 0);
  }
}

.modal-enter-active {
  animation: slideInLeft .5s ease;
}
.modal-leave-active {
  animation: slideOutLeft .5s ease;
}
</style>
