import buble from 'rollup-plugin-buble'
import pkg from './package.json'

const input = 'lib/ReactTags.js'

const external = [
  'react',
  'react-dom',
  'prop-types'
]

export default [
  {
    input,
    external,
    plugins: [
      buble({ objectAssign: 'Object.assign', target: { node: 6 } })
    ],
    output: {
      file: pkg.module,
      format: 'es'
    }
  },
  {
    input,
    external,
    plugins: [
      buble({ objectAssign: 'Object.assign' })
    ],
    output: {
      file: pkg.main,
      format: 'cjs'
    }
  }
]
