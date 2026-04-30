import type { FeatureModule } from '../../core/registry'

const parallaxFeature: FeatureModule = {
  name: 'parallax',
  requiredPlugins: ['ScrollTrigger'],
  init: () => () => {},
}

export default parallaxFeature
