export class ChangePath {
  apply(hooks) {
    hooks.emitFile.tap('changeoutpuPath', (context) => {
      context.changeoutputPath('./dist/xxm.js')
    })
  }
}
