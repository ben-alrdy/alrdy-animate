import type { FeatureModule } from '../../core/registry'

const hoverFeature: FeatureModule = {
  name: 'hover',
  requiredPlugins: [],
  init: () => () => {},
}

export default hoverFeature
