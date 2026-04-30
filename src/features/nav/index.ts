import type { FeatureModule } from '../../core/registry'

const navFeature: FeatureModule = {
  name: 'nav',
  requiredPlugins: ['ScrollTrigger', 'Flip'],
  init: () => () => {},
}

export default navFeature
