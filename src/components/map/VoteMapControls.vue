<template>
  <div class="vote-map-controls">
    <div class="mode-select">
      <div :class="{selected: isRegionSelected}" @click="selectMode('REGION')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 24.25"><g><polygon points="21 18.19 10.5 24.25 0 18.19 0 6.06 10.5 0 21 6.06 21 18.19"/></g></svg>
        <p>{{ $t('regions') }}</p>
      </div>
      <div :class="{selected: isDepartementSelected}" @click="selectMode('DEPARTMENT')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.98 22.89"><g><polygon points="5.18 10.72 4.22 9.05 5.18 7.38 7.11 7.38 8.07 9.05 7.11 10.72 5.18 10.72"/><polygon points="5.18 5.81 4.22 4.14 5.18 2.48 7.11 2.48 8.07 4.14 7.11 5.81 5.18 5.81"/><polygon points="5.18 15.62 4.22 13.96 5.18 12.29 7.11 12.29 8.07 13.96 7.11 15.62 5.18 15.62"/><polygon points="5.31 20.53 4.34 18.86 5.31 17.2 7.23 17.2 8.19 18.86 7.23 20.53 5.31 20.53"/><polygon points="13.74 10.72 12.78 9.05 13.74 7.38 15.67 7.38 16.63 9.05 15.67 10.72 13.74 10.72"/><polygon points="13.74 5.81 12.78 4.14 13.74 2.48 15.67 2.48 16.63 4.14 15.67 5.81 13.74 5.81"/><polygon points="13.74 15.62 12.78 13.96 13.74 12.29 15.67 12.29 16.63 13.96 15.67 15.62 13.74 15.62"/><polygon points="13.87 20.53 12.91 18.86 13.87 17.2 15.79 17.2 16.76 18.86 15.79 20.53 13.87 20.53"/><polygon points="9.53 18 8.56 16.34 9.53 14.67 11.45 14.67 12.41 16.34 11.45 18 9.53 18"/><polygon points="9.53 22.89 8.56 21.23 9.53 19.56 11.45 19.56 12.41 21.23 11.45 22.89 9.53 22.89"/><polygon points="9.53 8.22 8.56 6.56 9.53 4.89 11.45 4.89 12.41 6.56 11.45 8.22 9.53 8.22"/><polygon points="9.53 3.33 8.56 1.67 9.53 0 11.45 0 12.41 1.67 11.45 3.33 9.53 3.33"/><polygon points="9.53 13.11 8.56 11.45 9.53 9.78 11.45 9.78 12.41 11.45 11.45 13.11 9.53 13.11"/><polygon points="0.96 13.11 0 11.44 0.96 9.78 2.89 9.78 3.85 11.44 2.89 13.11 0.96 13.11"/><polygon points="0.96 8.16 0 6.5 0.96 4.83 2.89 4.83 3.85 6.5 2.89 8.16 0.96 8.16"/><polygon points="0.96 18.06 0 16.39 0.96 14.72 2.89 14.72 3.85 16.39 2.89 18.06 0.96 18.06"/><polygon points="18.09 13.11 17.13 11.44 18.09 9.78 20.01 9.78 20.98 11.44 20.01 13.11 18.09 13.11"/><polygon points="18.09 8.16 17.13 6.5 18.09 4.83 20.01 4.83 20.98 6.5 20.01 8.16 18.09 8.16"/><polygon points="18.09 18.06 17.13 16.39 18.09 14.72 20.01 14.72 20.98 16.39 20.01 18.06 18.09 18.06"/></g></svg>

        <p>{{ $t('departments') }}</p>
      </div>
    </div>
    <div class="ariane">
      <p v-for="(level, levelWeight) in history" @click="arianeClick(+levelWeight)" v-if="level.featureName">
        <span class="ariane-link">{{ $t(level.featureName) }}</span>
        <span class="UI-icon UI-slide-right" v-if="+levelWeight !== lastZoomLevelWeight"></span>
      </p>
    </div>
  </div>
</template>

<script>
import bus from 'emitter'
import { ZOOM_LEVEL } from 'utils/constants'
import { ZOOM_TO_SELECTED } from 'emitter/config'
import { UPDATE_ZOOM_LEVEL, UPDATE_ZOOM_MODE } from 'src/store/action-types'
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'VoteMapControls',

  computed: {
    ...mapState({
      currentZoomLevelWeight: ({zoomstate}) => zoomstate.currentZoomLevelWeight,
      isRegionSelected: ({zoomstate}) => zoomstate.levels[0].nextLevelWeight === ZOOM_LEVEL.REGION.weight,
      isDepartementSelected: ({zoomstate}) => zoomstate.levels[0].nextLevelWeight === ZOOM_LEVEL.DEPARTMENT.weight,
      history: ({selection}) => selection.history
    }),

    ...mapGetters({
      isFirstLevelWeight: 'isFirstLevelWeight',
      lastZoomLevelWeight: 'lastZoomLevelWeight',
      firstZoomLevelWeight: 'firstZoomLevelWeight'
    })
  },

  methods: {
    ...mapActions({
      updateZoomLevel: UPDATE_ZOOM_LEVEL,
      updateZoomMode: UPDATE_ZOOM_MODE
    }),


    arianeClick (levelWeight) {
      if (this.currentZoomLevelWeight === levelWeight) bus.$emit(ZOOM_TO_SELECTED)
      else this.updateZoomLevel(levelWeight)
    },


    selectMode (keyMode) {
      console.log('select mode', ZOOM_LEVEL[keyMode].geoKey)
      this.updateZoomMode(ZOOM_LEVEL[keyMode].geoKey)
    }
  }
}
</script>

<style lang="scss">
@import "~styles/global";

$selectModeTransitionTime: 600ms;
.vote-map-controls{
  border-top: 1px solid $grey-interface;
}
.mode-select{
  font-size: 0;
  border-bottom: 1px solid $grey-cold-1;
  // background: gold;

  div {
    height: 48px;
    width: 50%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    font-size: 1rem;

    p{
      margin: 0 0 0 10px;
      font-size: 0.9em;
      color: #c4d4dc;
    }

    svg {
      height: 18px;
    }

    circle,
    polygon,
    path {
      fill: #c4d4dc;
      transition: all $selectModeTransitionTime ease;
    }

  }

  div:hover {
    cursor: pointer;
  }

  div.selected {
    circle,
    polygon,
    path {
      fill: $font-color-main;
    },

    p{
      color: $font-color-main;
    }
  }
  div:before {
    content: '';
    position: absolute;
    width: 0;
    top: 0;
    left: 50%;
    border-top: 4px solid $font-color-main;
    transition: all $selectModeTransitionTime / 3 ease-out;
  }
  div.selected:before {
    width: 100%;
    left: 0;
  }

}
.ariane{
  margin: 12px 0 0 0;
  font-size: 0;
  text-align: left;
  display: block;
  width: 100%;
  line-height: 24px;

  p {
    font-size: 14px;
    display: inline-block;
    margin: 0;
    padding: 0;
  }
  .ariane-link {
    cursor: pointer;
    letter-spacing: -0.025em;
    border-bottom: 1px solid $grey-cold-2;
    transition: all 500ms ease
  }
  p:last-of-type .ariane-link{
    font-weight: 600;
    border: 1px solid transparent;
    color: $font-color-main;
  }
  .UI-icon{
    vertical-align: middle;
    margin: 0 3px;
  }
}

@media #{$break-medium} {
  .vote-map-controls{
    display: flex;
    align-items: center;
  }
  .mode-select{
    border: none;
    min-width: 192px;
    div {
      height: 96px;
      vertical-align: center;
      flex-direction: column;

      p {
        margin: 5px 0 0 0;
      }
    }
  }
  .ariane{
    margin: 0 0 0 50px;
    width: auto;
    p {
      font-size: 1rem;
    }

    .UI-icon{
      margin: 0 6px;
    }
  }
}
</style>
