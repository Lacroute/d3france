<template>
  <div class="full">
    <podium-container></podium-container>
    <div class="separator"></div>
    <map-container></map-container>
  </div>
</template>

<script>
import PodiumContainer from 'components/PodiumContainer'
import MapContainer from 'components/MapContainer'
export default {
  name: 'FullContainer',
  components: {PodiumContainer, MapContainer}
}
</script>

<style lang="css">
.full .separator{
  margin-top: 36px;
}
</style>
