import type { FeatureModule } from '../../core/registry'

const textFeature: FeatureModule = {
  name: 'text',
  requiredPlugins: ['ScrollTrigger', 'SplitText'],
  init: () => () => {},
}

export default textFeature
