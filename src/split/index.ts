import type { FeatureModule } from '../core/registry'

const splitFeature: FeatureModule = {
  name: 'split',
  requiredPlugins: ['SplitText'],
  init: () => () => {},
}

export default splitFeature
