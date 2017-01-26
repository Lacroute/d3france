<template lang="html">
  <div>
    <modal-handler></modal-handler>
    <credits></credits>
    <footer>
      <div class="container">
        <button href="#" @click.prevent="triggerToggle()">
          <s class="UI-icon UI-info"></s>
        </button>
        <logo></logo>
      </div>
    </footer>
  </div>
</template>

<script>
import ModalHandler from 'components/common/ModalHandler'
import Credits from 'components/common/Credits'
import Logo from 'components/common/Logo'
import eventEmitter from 'emitter'

export default {
  name: "MetaContainer",

  components: {
    Credits,
    Logo,
    ModalHandler
  },

  methods: {
    triggerToggle: () => eventEmitter.$emit('toggle-credits')
  }
}
</script>

<style lang="scss" scoped>
@import '~utils/fonts';
@import '~utils/metas';

  footer{
    padding: $meta_padding;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    .container{
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .UI-info{
      transition: color .3s ease;
      color: $info_bg;
    }
    .UI-info:hover{
      color: inherit;
    }

    button{
      @extend %reset-button;
      line-height: 0;
    }
  }
</style>
