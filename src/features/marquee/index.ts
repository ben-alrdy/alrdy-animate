import type { FeatureModule } from '../../core/registry'

const marqueeFeature: FeatureModule = {
  name: 'marquee',
  requiredPlugins: [],
  init: () => () => {},
}

export default marqueeFeature
