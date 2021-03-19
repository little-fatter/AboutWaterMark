import Module from './module'
import { assert, forEachValue } from '../util'

/* 将传入的options对象整个构造为一个module对象，
并循环调用 this.register([key], rawModule, false) 
为其中的modules属性进行模块注册，使其都成为module对象，
最后options对象被构造成一个完整的组件树 */

export default class ModuleCollection {
  constructor (rawRootModule) {
    // 构造ModuleCollection类
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false)
  }

  // 拿到模块
  get (path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }

  // 获取命名空间的名字
  getNamespace (path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }

  // 热更新
  update (rawRootModule) {
    update([], this.root, rawRootModule)
  }

  // 注册模块
  register (path, rawModule, runtime = true) {
    if (__DEV__) {
      assertRawModule(path, rawModule)
    }
    // 实例化一个模块
    const newModule = new Module(rawModule, runtime)
    // 如果是根模块，那么就挂载在 this.root 上面
    if (path.length === 0) {
      this.root = newModule
    } else {
      // 如果不是根模块，那么取它的父模块，将其添加到其父模块下
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }

    // 如果实例化的对象还有子模块，那么使用 forEachValue 递归注册其所有的子孙模块
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }

  // 取消模块的注册
  unregister (path) {
    // 取出模块的父模块，因为使用了模块，所以最上面是 root ，肯定是位于第二级，所以不用担心这里会出问题
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    // 非动态加载的模块不能取消
    if (!parent.getChild(key).runtime) return

    parent.removeChild(key)
  }

  isRegistered (path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]

    return parent.hasChild(key)
  }
}

function update (path, targetModule, newModule) {
  if (__DEV__) {
    assertRawModule(path, newModule)
  }

  // 调用指定模块的 update 方法，并将新的模块传入
  targetModule.update(newModule)

  // 对新模块的子模块进行遍历操作
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (__DEV__) {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}

const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}

const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}

function assertRawModule (path, rawModule) {
  Object.keys(assertTypes).forEach(key => {
    if (!rawModule[key]) return

    const assertOptions = assertTypes[key]

    forEachValue(rawModule[key], (value, type) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}

function makeAssertionMessage (path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
