import type { FeatureModule } from '../../core/registry'

const modalFeature: FeatureModule = {
  name: 'modal',
  requiredPlugins: [],
  init: () => () => {},
}

export default modalFeature
