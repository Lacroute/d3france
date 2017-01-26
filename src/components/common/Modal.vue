<template lang="html">
  <section>
    <div class="container">
      <div class="content">
        <slot name="header"></slot>
        <slot name="body"></slot>
        <slot name="footer"></slot>
      </div>
    </div>
  </section>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
@import '~utils/fonts';
@import '~utils/metas';

section{
  display: block;
  position: absolute;
  height: auto;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: $modal_padding;
  background: $loading_bg;
  color: $loading_color;
  z-index: 1;
}

.container{
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;

  h1, h2{
    font-family: $source_sans_pro;
    text-transform: uppercase;
    line-height: 1.25em;
  }

  h1 + h1 {margin-top: $meta_padding}

  h1 {font-size: 1em;}
  h2 {font-size: 0.8em;}

  button {
    @extend %reset-button;
    border: 1px solid lighten($loading_color, 20%);
    border-radius: 3px;
    padding: 10px 9px;
    color: inherit;
    text-transform: uppercase;
    font-size: 0.9em;
  }
}

.loader-animation {
  position: relative;
  margin: 0 auto;
  width: 32px;
  &:before {
    content: '';
    display: block;
    padding-top: 100%;
  }
}

.circular {
  animation: rotate 2s linear infinite;
  height: 100%;
  transform-origin: center center;
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}

.path {
  stroke-dasharray: 1, 200;
  stroke-dashoffset: 0;
  animation: dash 1.5s ease-in-out infinite;
  stroke-linecap: round;
  stroke: $loading_color;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124px;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
