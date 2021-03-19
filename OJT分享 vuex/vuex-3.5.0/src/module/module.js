import { forEachValue } from '../util'

// Base data struct for store's module, package with some attribute and method
export default class Module {
  constructor (rawModule, runtime) {
    // 动态加载的模块为true
    this.runtime = runtime
    // 存子模块
    this._children = Object.create(null)
    // 存原始模块数据
    this._rawModule = rawModule
    const rawState = rawModule.state

    // 存模块默认的state
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }

  // 是否有命名空间
  get namespaced () {
    return !!this._rawModule.namespaced
  }

  // 添加子模块
  addChild (key, module) {
    this._children[key] = module
  }

  // 移除子模块
  removeChild (key) {
    delete this._children[key]
  }

  // 获取子模块
  getChild (key) {
    return this._children[key]
  }

  // 是否有子模块
  hasChild (key) {
    return key in this._children
  }

  // 更新模块
  update (rawModule) {
    this._rawModule.namespaced = rawModule.namespaced
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters
    }
  }

  // 给每个子模块执行指定回调，这里使用了 util 中的 forEachValue 方法来实现
  forEachChild (fn) {
    forEachValue(this._children, fn)
  }

  // 对每一个 getter 执行指定回调
  forEachGetter (fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  // 对每一个 action 执行指定回调
  forEachAction (fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  // 对每一个 mutation 执行指定回调
  forEachMutation (fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}
