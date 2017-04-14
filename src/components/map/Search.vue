<template>
  <div class="search">
    <div class="search-wrapper">
      <div class="possibilities">
        <div class="answer" v-for="(city, index) in possibilities" :class="[{selected: index === selectedIndex}]" @click="selectPossibility(city, index)">
          <p>
            <span class="city-name">{{ city.content.name }}</span> <span class="dpt-code">({{ displayCodeDpt(city.content.code_dept) }})</span>
          </p>
        </div>
      </div>
      <form @submit.prevent="selectCity" v-on:keyup.40="arrowNavigationDown()" v-on:keyup.38="arrowNavigationUp()">
        <input ref="input" type="text" v-model="city" :placeholder="$t('search_placeholder')" :class="inputClass" autofocus="true">
        <button type="button" name="validation" @click="searchClick()"><span class="UI-icon UI-search"></span></button>
      </form>
    </div>
  </div>
</template>

<script>
import { BASE, POLLS } from 'api/vote/config'
import { ZOOM_FOR_SEARCH } from 'emitter/config'
import bus from 'emitter'

export default {
  name: 'Search',

  data () {
    return {
      city: null,
      active: false,
      error: false,
      fetching: false,
      selectedIndex: null,
      possibilities: []
    }
  },

  computed: {
    params () {
      return {q: this.city.replace(/</g, '&lt;').replace(/>/g, '&gt;').toLowerCase()}
    },

    inputClass () {
      return {
        error: this.error,
        fetching: this.fetching,
        active: this.active
      }
    },

    selected () {
      return this.possibilities[this.selectedIndex]
    }
  },

  watch: {
    city (editing) {
      if (this.selected && this.city !== this.selected.content.name) {
        this.selectedIndex = null
      }
      this.queryServer(editing)
    }
  },

  methods: {

    displayCodeDpt (code) {
      return code.charAt(0) === '0' ? code.substring(1) : code
    },


    backToNormal () {
      this.fetching = false
      this.error = false
    },



    queryServer (wanted) {
      this.error = false
      if (!wanted || wanted.length < 2) {
        this.possibilities = []
        return
      }
      if (wanted.match(/<|>/g, '&lt;')) {
        this.error = true
        return
      }
      if (this.selected) return

      this.$http.get(`${BASE}/${POLLS}/zones/search`, {
        params: this.params,
        before (request) {
          // abort previous request, if exists
          if (this.previousRequest) {
            this.previousRequest.abort()
          }

          // set previous request on Vue instance
          this.previousRequest = request
        },
        progress: (progressEvent) => {
          this.fetching = true
        }
      })
      .then(
        response => {
          this.backToNormal()
          if (response.body.hits.length === 0) {
            this.error = true
            return
          }

          this.possibilities = response.body.hits.map(hit => ({key: hit.code_dept, content: hit, selected: false}))
          this.selectedIndex = this.possibilities.length
        },
        fail => {
          // If fail beacause abort
          if (fail.status === 0) return
          console.log(fail.status)
          this.backToNormal()
          console.log('not found')
          if (fail.status === 400) {
            this.error = true
          }
        }
      )
    },


    searchClick () {
      this.active = !this.active
      this.possibilities = []
      this.selectedIndex = null
      if (this.active) {
        this.$refs.input.focus()
        this.queryServer(this.city)
      }
    },


    selectPossibility (city, index) {
      this.selectedIndex = index
      this.selectCity()
    },


    arrowNavigationUp () {
      let threshold = 0
      if (threshold > this.selectedIndex - 1) {
        this.selectedIndex = this.possibilities.length - 1
      } else {
        this.selectedIndex = Math.max(threshold, this.selectedIndex - 1)
      }
      this.city = this.selected.content.name
    },


    arrowNavigationDown () {
      let threshold = this.possibilities.length - 1
      if (threshold < this.selectedIndex + 1) {
        this.selectedIndex = 0
      } else {
        this.selectedIndex = Math.min(this.possibilities.length - 1, this.selectedIndex + 1)
      }
      this.city = this.selected.content.name
    },


    selectCity () {
      console.log('go for', this.selected.content.code_reg, this.selected.content.code_dept, this.selected.content.code_comm)
      bus.$emit(
        ZOOM_FOR_SEARCH,
        [`reg_${this.selected.content.code_reg}`, `dpt_${this.selected.content.code_dept}`, `cit_${this.selected.content.code_comm}`]
      )
      this.active = false
      this.possibilities = []
      this.selectedIndex = null
      this.city = null
    }
  }
}
</script>

<style lang="scss">
@import "~styles/global";
.search{
  $over: 16px;
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;

  .search-wrapper{
    margin: $over;
  }

  $formHeight: 36px;
  form{
    position: relative;
    font-size: 0;
    height: $formHeight;
    text-align: right;
    > *{
      font-size: 1rem;
      border: none;
      border-radius: 2px;
      box-sizing: border-box;
      -webkit-appearance: none;
      height: 100%;
      padding: 0;
      margin: 0;
      outline:0;
    }
    button{
      cursor: pointer;
      background: white;
      position: absolute;
      top: 0;
      right: 0;
      width: $formHeight;
    }
  }
  button, input {
    border: 1px solid rgba($font-color-main, .25);
  }
  input{
    background: white;
    width: 0;
    padding-left: $over;
    line-height: 100%;
    transition: all 500ms ease;
  }
  input.active{
    width: 100%;
  }
  input.error{
    background: tomato;
  }
  input.fetching{
    background: orange;
  }
  span{
    display: inline-block;
    vertical-align: middle;
  }
  .answer{
    background: white;
    height: 40px;
    line-height: 40px;
    text-align: left;
    padding: 0 16px;
    font-size: 15px;
    transition: all 100ms ease;
    cursor: pointer;

    p{
      margin: 0;
      padding: 0;
    }
    .city-name {
      max-width: 80%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
    }
    .dpt-code {
      margin-left: 7px;
    }
  }

  $border: 1px solid $grey-cold-1;
  .answer + .answer {
    border-top: $border;
  }
  .answer:last-child{
    border-bottom: $border;
  }

  .answer:hover, .answer.selected{
    background: $font-color-main;
    color: white;
  }
}
</style>
