<template>
  <div>
    <p class="status">status: {{ status.TEXT }} </p>

    <div class="controls" >

      <div class="control displays" v-if="false">
        <label for="display-mesh">
          Display Mesh
          <input type="checkbox" id="display-mesh" v-model="displayMesh" disabled>
        </label>
        <label for="display-area">
          display Area
          <input type="checkbox" id="display-area" v-model="displayArea" disabled>
        </label>
      </div>

      <div class="control projections">
        <label for="mercator">
          Mercator
          <input type="radio" id="mercator" value="mercator" name="projection" v-model="projection">
        </label>
        <label for="geo-conic-conformal-france">
          Conic Conformal France
          <input type="radio" id="geo-conic-conformal-france" value="conicConformalFrance" name="projection" v-model="projection" disabled>
        </label>
      </div>

      <div class="control mode">
        <label for="auto">
          Auto
          <input type="radio" id="auto" name="mode" value="auto" v-model="mode">
        </label>
        <label for="communes">
          Communes
          <input type="radio" id="communes" name="mode" value="communes" v-model="mode">
        </label>
        <label for="departements">
          Départements
          <input type="radio" id="departements" name="mode" value="departements" v-model="mode">
        </label>
        <label for="regions">
          Régions
          <input type="radio" id="regions" name="mode" value="regions" v-model="mode">
        </label>
      </div>

      <div class="control actions">
        <button type="button" id="clearAll" @click.prevent.stop="clearAll()">CLEAR ALL</button>
        <button type="button" id="clearGraphic" @click.prevent.stop="clearGraphic()">CLEAR GRAPHIC</button>
        <button type="button" id="init" @click.prevent.stop="initGraph()">INIT GRAPH</button>
        <button type="button" id="draw" @click.prevent.stop="draw()" :disabled="!canDraw">DRAW</button>
      </div>
    </div>

    <div class="wrapper-graph">
      <router-view :topofile="topofile" :width="width" :height="height" :displayMesh="displayMesh" :displayArea="displayArea" :projection="projection" :mode="mode"></router-view>
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

      topofile: FILES_CONFIG.communesFull,

      width: 664,
      height: 480,

      // projection: 'geoConicConformalFrance',
      projection: 'mercator',
      mode: 'departements',
      displayMesh: true,
      displayArea: true,
    }
  },


  computed: {
    canDraw () {
      return this.status.CODE >= STATUS.GRAPHIC_READY.CODE
    }
  },


  created () {
    bus.$on('statusUpdate', this.updateStatus)
  },


  watch: {
    displayMesh () {
      this.status = STATUS.LOADED
    },


    displayArea () {
      this.status = STATUS.LOADED
    },


    projection () {
      bus.$emit('clearAll')
    },
  },


  methods: {
    updateStatus (newStatus) {
      this.status = newStatus
    },


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
  },


  destroyed () {
    bus.$off('statusUpdate', this.updateStatus)
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
  padding-bottom: 2em;
  border-bottom: 2px solid $grey-neutral-4;

  .control + .control{
    margin-top: 1.5em;
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
