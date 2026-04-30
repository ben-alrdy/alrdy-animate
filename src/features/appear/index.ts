import type { FeatureModule } from '../../core/registry'

const appearFeature: FeatureModule = {
  name: 'appear',
  requiredPlugins: ['ScrollTrigger'],
  init: () => () => {},
}

export default appearFeature
