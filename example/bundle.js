;(function (modules) {
  function require(filePath) {
    const fn = modules[filePath]
    const module = {
      exports: {},
    }
    fn(require, module, module.exports)

    return module.exports
  }

  require('./main.js')
})({
  './foo.js': function (require, module, exports) {
    function foo() {
      console.log('foo')
    }
    module.exports = { foo }
  },
})
