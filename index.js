import fs from 'fs'
import parser from '@babel/parser'
import traverse from '@babel/traverse'

function createAssets() {
  const source = fs.readFileSync('./example/main.js', {
    encoding: 'utf-8',
  })
  const deps = []
  const ast = parser.parse(source, { sourceType: 'module' })
  traverse.default(ast, {
    ImportDeclaration({ node }) {
      deps.push(node.source.value)
    },
  })

  return { source, deps }
}

const assets = createAssets()
console.log(assets)
