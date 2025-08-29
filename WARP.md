# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Build & Development
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Clean build artifacts
npm run clean

# Build and update CDN files
npm run build:cdn
```

### Testing & Validation
```bash
# Open test suite in browser
open tests/index.html

# Create local package for testing
npm pack

# Test in another project
npm install ../path/to/alrdy-animate-version.tgz
```

### Release Process
```bash
# For bug fixes (x.x.1)
npm version patch

# For new features (x.1.0)
npm version minor

# For breaking changes (1.0.0)
npm version major
```

## High-Level Architecture

### Core Structure
AlrdyAnimate is a JavaScript animation library with optional GSAP integration, built as a UMD bundle with CSS animations as the foundation and progressive enhancement through GSAP features.

**Main Entry Point**: `src/js/AlrdyAnimate.js`
- Initializes core animation system
- Manages feature loading via dynamic imports and webpack chunks
- Handles element discovery, settings processing, and observer setup

**Build System**: Webpack with dynamic chunk splitting
- Core library: Always loaded
- GSAP features: Lazy-loaded chunks (gsap-core, gsap-text, gsap-draggable, etc.)
- CSS animations: Bundled as separate stylesheet

### Key Architectural Components

#### 1. Module Bundle System (`src/js/utils/moduleBundle.js`)
- **gsapBundles**: Defines feature-to-module mappings with dependency chains
- **Chunk Strategy**: Each GSAP feature loads as separate webpack chunk for performance
- **Dual Mode**: Supports both bundled GSAP and Webflow's global GSAP instance

#### 2. Template System (`src/js/utils/templateHandler.js`)
- Class-based animation definitions without requiring HTML attributes
- Pre-defined themes (floaty, bouncy) and custom class mappings
- Priority system: HTML attributes override template settings

#### 3. Element Processing Pipeline
```
Element Discovery → Template Processing → Settings Resolution → Animation Application
```
- Elements discovered via `[aa-animate]`, `[aa-children]`, `[aa-hover]` selectors
- Template classes added to element discovery if templates configured
- Mobile/desktop setting variants supported with `|` separator

#### 4. Animation Categories
- **CSS Animations**: Base system using CSS transitions and keyframes
- **GSAP Features**: Modular enhancements loaded on-demand
  - `text`: Text splitting and animation (SplitText dependency)
  - `slider`: Draggable sliders (Draggable, InertiaPlugin dependencies)  
  - `scroll`: Parallax, sticky nav, section animations (ScrollTrigger)
  - `hover`: Interactive hover effects
  - `modal`: Accessible modal system
  - `accordion`: Expandable content sections

#### 5. Smooth Scrolling Integration
- Optional Lenis integration for smooth scrolling
- GSAP ScrollTrigger coordination
- Modal scroll prevention with `data-lenis-prevent`

### Data Flow

#### Initialization Sequence
1. **Core Setup**: IntersectionObserver, CSS variables, element discovery
2. **GSAP Loading**: Parallel loading of requested features as webpack chunks
3. **Plugin Registration**: Dynamic registration of GSAP plugins to global scope
4. **Animation Creation**: Feature-specific animation function creation
5. **Observer Setup**: IntersectionObserver for scroll-triggered animations

#### Runtime Animation Trigger
```
Scroll Event → IntersectionObserver → Element Settings → Animation Function → CSS/GSAP Execution
```

### Build & Deployment Architecture

#### Webpack Configuration
- **Entry**: Single entry point with dynamic imports for code splitting
- **Output**: UMD bundle with global `AlrdyAnimate` export
- **Chunks**: Feature-based splitting (gsap-core, gsap-text, gsap-draggable, lenis)
- **CSS**: Extracted to separate stylesheet via MiniCssExtractPlugin

#### Dual CDN Strategy
- **npm/unpkg**: Standard npm package distribution
- **GitHub CDN**: Version-specific and latest tag distribution via jsdelivr
- **Structure**: `/cdn/` contains both versioned (`/cdn/v6.11.1/`) and latest files

#### Release Automation
The `npm version` command triggers automatic:
- Version update in package.json
- Production build generation
- CDN file deployment to `/cdn/` directory
- Git tag creation (both version-specific and 'latest')
- npm publishing
- GitHub push with tags

### Testing Structure
- **Manual Testing**: HTML test files in `/tests/` directory
- **Feature Coverage**: Separate test pages for each animation category
- **Integration Testing**: Live testing with built assets via `tests/index.html`

## Development Guidelines

### Adding New GSAP Features
1. Create animation module in `src/js/gsapAnimations/[feature]Animations.js`
2. Export `create[Feature]Animations(gsap, dependencies...)` function  
3. Add entry to `gsapBundles` in `moduleBundle.js` with dependencies
4. Update webpack chunk configuration if needed

### Feature Dependencies
- Text animations require SplitText plugin
- Slider animations require Draggable + InertiaPlugin
- All scroll-based features require ScrollTrigger

### CSS Animation Development
- Base animations defined in `src/scss/_animations.scss`
- Keyframes in `src/scss/_keyframes.scss`  
- CSS custom properties for dynamic values set via JavaScript

### Mobile Considerations
- Mobile breakpoint: 768px (`isMobile = window.innerWidth < 768`)
- Setting variants: `desktop|mobile` syntax in attributes
- Separate mobile delays: `aa-delay-mobile` attribute override

## Important Files

### Configuration
- `package.json`: Build scripts, dependencies, npm configuration
- `webpack.config.js`: Build system with chunk splitting strategy
- `docs/DEPLOYMENT.md`: Release process and CDN deployment guide

### Core Implementation
- `src/js/AlrdyAnimate.js`: Main initialization and orchestration logic
- `src/js/utils/moduleBundle.js`: Feature loading and dependency management
- `src/js/utils/templateHandler.js`: Class-based animation system
- `src/js/utils/elementAttributes.js`: Settings parsing and mobile variants

### Build Assets
- `scripts/deploy-cdn.js`: CDN deployment automation
- `dist/`: Production build output (auto-generated)
- `cdn/`: CDN distribution files (auto-generated)
