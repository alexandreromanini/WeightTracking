import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom n'implémente pas ResizeObserver, utilisé par ResponsiveContainer (Recharts).
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
