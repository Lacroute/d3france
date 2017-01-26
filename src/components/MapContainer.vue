<template>
  <div>
    <p class="status">status: {{ status.TEXT }} </p>

    <div class="controls" >

      <div class="displays">
        <label for="display-mesh">
          Display Mesh
          <input type="checkbox" name="display-mesh" v-model="displayMesh">
        </label>
        <label for="display-area">
          display Area
          <input type="checkbox" name="display-area" v-model="displayArea">
        </label>
      </div>

      <div class="actions">
        <button type="button" name="clearAll" @click.prevent.stop="clearAll()">CLEAR ALL</button>
        <button type="button" name="clearGraphic" @click.prevent.stop="clearGraphic()">CLEAR GRAPHIC</button>
        <button type="button" name="init" @click.prevent.stop="initGraph()">INIT GRAPH</button>
        <button type="button" name="draw" @click.prevent.stop="draw()" :disabled="!canDraw">DRAW</button>
      </div>
    </div>

    <div class="wrapper-graph">
      <router-view :topofile="topofile" :width="width" :height="height" :displayMesh="displayMesh" :displayArea="displayArea" :key="$route.name"></router-view>
    </div>
  </div>
</template>

<script>
import bus from 'emitter'
import * as STATUS from 'utils/graphicStatus'
import * as FILES_CONFIG from 'utils/filesConfig'


export default {
  name: 'MapContainer',

  data () {
    return {
      status: {CODE: null, TEXT: null},

      topofile: FILES_CONFIG.communes,

      width: 664,
      height: 480,

      displayMesh: true,
      displayArea: false,
    }
  },

  computed: {
    canDraw () {
      return this.status.CODE >= STATUS.GRAPHIC_READY.CODE
    }
  },

  created () {

    console.log(this.$route);

    bus.$on('statusUpdate', statusData => {
      this.status = statusData
    })
  },

  watch: {
    displayMesh () {
      this.status.CODE = STATUS.LOADED
    },

    displayArea () {
      this.status.CODE = STATUS.LOADED
    }
  },

  methods: {
    clearAll () {
      bus.$emit('clearAll')
    },

    clearGraphic () {
      bus.$emit('clearGraphic')
    },

    initGraph () {
      bus.$emit('initGraph')
    },

    draw () {
      bus.$emit('draw')
    },
  }
}
</script>

<style lang="scss">
@import "~utils/global";

.status{
  display: inline-block;
  min-width: 150px;
  padding: 10px;
  background: $grey-neutral-5;
  color: white;
}

.controls{
  border-bottom: 2px solid $grey-neutral-4;

  .actions{
    margin: 20px;
  }
}

.graphic{
  padding: 15px;
  background: $grey-neutral-1;

  svg, canvas{
    background: white;
    border: 1px solid $grey-neutral-2;
  }

  .mesh{
    fill: none;
    stroke: $yellow-sun-5;
    stroke-width: 0.2px;
  }

  .area{
    fill: $grey-neutral-6;
    stroke: none;
  }
}
</style>
