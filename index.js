import fs from 'fs'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import path from 'path'
import ejs from 'ejs'
import { transformFromAst } from 'babel-core'

function createAssets(filePath) {
  const source = fs.readFileSync(filePath, {
    encoding: 'utf-8',
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

  return { filePath, code, deps }
}

function createGraph() {
  const mainAsset = createAssets('./example/main.js')

  const queue = [mainAsset]
  for (const asset of queue) {
    asset.deps.forEach((relativePath) => {
      const child = createAssets(path.resolve('./example', relativePath))
      queue.push(child)
    })
  }

  return queue
}
const graph = createGraph()

function build(graph) {
  const template = fs.readFileSync('./bundle.ejs', { encoding: 'utf-8' })
  const data = graph.map((asset) => {
    return { filePath: asset.filePath, code: asset.code }
  })
  const code = ejs.render(template, { data })

  fs.writeFileSync('./dist/bundle.js', code)
}
build(graph)
