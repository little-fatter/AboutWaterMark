export default function (Vue) {
  const version = Number(Vue.version.split('.')[0])

  // 2.0使用hook的方形式注入，兼容vue 1.x 
  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit })
  } else {
    // override init and inject vuex init procedure
    // for 1.x backwards compatibility.
    const _init = Vue.prototype._init
    Vue.prototype._init = function (options = {}) {
      options.init = options.init
        ? [vuexInit].concat(options.init)
        : vuexInit
      _init.call(this, options)
    }
  }

  /* 将初始化Vue根组件时传入的store设置到this对象的$store属性上，
     子组件从其父组件引用$store属性，层层嵌套进行设置
  */  
function vuexInit () {
    const options = this.$options
    // store injection
    if (options.store) {
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store
    } else if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store
    }
  }
}
