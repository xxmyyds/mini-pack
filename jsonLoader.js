export function jsonLoader(source) {
  this.addDeps('xxmyyds')
  return `export default ${JSON.stringify(source)}`
}
