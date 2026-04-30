import type { FeatureModule } from '../../core/registry'

const sliderFeature: FeatureModule = {
  name: 'slider',
  requiredPlugins: ['Draggable', 'InertiaPlugin'],
  init: () => () => {},
}

export default sliderFeature
