import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode would double-fire effects in dev, which would re-run the
  // alrdy init+destroy cycle twice on every navigation and obscure the
  // transition timing. Disabled here for clarity of the demo; flip on if
  // you want to stress-test the lifecycle.
  reactStrictMode: false,
  // Silence the "multiple lockfiles" warning — this example lives inside
  // the alrdy-animate monorepo, but it's its own self-contained project.
  outputFileTracingRoot: __dirname,
}

export default nextConfig
