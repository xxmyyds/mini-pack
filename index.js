import fs from 'fs'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import path from 'path'
import ejs from 'ejs'
import { transformFromAst } from 'babel-core'
import { jsonLoader } from './jsonLoader.js'
import { ChangePath } from './ChangePath.js'
import { SyncHook } from 'tapable'

let id = 0
const config = {
  module: {
    rules: [
      {
        test: /\.json$/,
        use: [jsonLoader],
      },
    ],
  },
  plugins: [new ChangePath()],
}

const hooks = {
  emitFile: new SyncHook(['context']),
}

function createAssets(filePath) {
  let source = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  })
  const loaders = config.module.rules
  const loaderContext = {
    addDeps(deps) {
      console.log(deps)
    },
  }

  loaders.forEach(({ test, use }) => {
    if (test.test(filePath)) {
      if (Array.isArray(use)) {
        use.reverse().forEach((fn) => {
          source = fn.call(loaderContext, source)
        })
      }
    }
  })
  const deps = []
  const ast = parser.parse(source, { sourceType: 'module' })
  traverse.default(ast, {
    ImportDeclaration({ node }) {
      deps.push(node.source.value)
    },
  })

  const { code } = transformFromAst(ast, null, {
    presets: ['env'],
  })

  return { filePath, code, deps, id: id++, mapping: {} }
}

function initPlugins() {
  const plugins = config.plugins
  plugins.forEach((plugin) => {
    plugin.apply(hooks)
  })
}

initPlugins()

function createGraph() {
  const mainAsset = createAssets('./example/main.js')

  const queue = [mainAsset]
  for (const asset of queue) {
    asset.deps.forEach((relativePath) => {
      const child = createAssets(path.resolve('./example', relativePath))
      asset.mapping[relativePath] = child.id
      queue.push(child)
    })
  }

  return queue
}
const graph = createGraph()

function build(graph) {
  const template = fs.readFileSync('./bundle.ejs', { encoding: 'utf-8' })
  const data = graph.map((asset) => {
    const { id, code, mapping } = asset
    return { id, code, mapping }
  })
  const code = ejs.render(template, { data })
  let outputPath = './dist/bundle.js'
  const context = {
    changeoutputPath(path) {
      outputPath = path
    },
  }
  hooks.emitFile.call(context)
  fs.writeFileSync(outputPath, code)
}
build(graph)
