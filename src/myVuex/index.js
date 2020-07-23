let Vue;
const install = (_Vue) => {
  Vue = _Vue;
  Vue.mixin({
    // 实例初始化后立即同步调用，在数据检测和事件/watcher设置之前
    beforeCreate () {
      const { store } = this.$options;
      if (store) {
        this.$store = store;
      } else { // 子组件在渲染的时候会获取父组件的$store(组件会从上到下进行渲染)
        this.$store = this.$parent && this.$parent.$store;
      }
    }
  });
};

// object iterate
const forEach = (obj, cb) => {
  if (obj == null) return;
  Object.keys(obj).forEach((key) => {
    cb(obj[key], key, obj);
  });
};
const installModule = (store, rootState, current, path = []) => {
  // { state: {}, modules: { a: { namespaced: true, modules: {a1: {namespaced: true}}} }}
  // path: [a, a1] store.modules.a.modules.a1
  // a/a1/
  let prefix = '';
  path.reduce((prev, cur) => {
    const item = prev.modules[cur];
    if (item && item.namespaced) {prefix = prefix + cur + '/';}
    return item;
  }, store.root);
  registerState(rootState, current, path);
  registerMutations(store, current, prefix, path);
  registerActions(store, current, prefix);
  registerGetters(store, current);
  registerChildren(store, rootState, current, path);
};

function registerMutations (store, module, prefix, path) {
  // {state: {x: 1}, modules: {a: {state: {y:2}, modules: {b: {state: {z:3}}}} }}
  // {state: {x: 1, a: {y:2}, b: {z:3}}}
  // [a, b] store.state.a.b
  // const state = path.reduce((prev, cur) => {
  //   return prev[cur];
  // }, store.state);
  forEach(module.mutations, (mutation, key) => {
    key = prefix + key;
    const entry = store.mutations[key] = store.mutations[key] || [];
    entry.push((payload) => {
      // 这里module.state在registerState的时候将module.state赋值给this.state, 所以它们指向了同一片堆内存空间
      mutation(module.state, payload);
    });
  });
}

function registerActions (store, module, prefix) {
  forEach(module.actions, (action, key) => {
    key = prefix + key;
    const entry = store.actions[key] = store.actions[key] || [];
    entry.push((payload) => {
      action(store, payload);
    });
  });
}

function registerGetters (store, module) {
  forEach(module.getters, (getter, key) => {
    Object.defineProperty(store.getters, key, {
      get: () => {
        return getter(module.state);
      }
    });
  });
}

function registerState (rootState, module, path) {
  if (path.length === 0) {
    rootState = module.state;
  } else {
    const parent = path.slice(0, -1).reduce((prev, cur) => {
      return prev[cur];
    }, rootState);
    const latestKey = path[path.length - 1];
    // 新增属性不具有响应式
    Vue.set(parent, latestKey, module.state);
  }
}

function registerChildren (store, rootState, module, path) {
  forEach(module.modules, (child, key) => {
    installModule(store, rootState, child, path.concat(key));
  });
}

class Store {
  constructor (options) {
    const { state, mutations, actions, getters } = options;
    // 执行Vue.use会执行install方法，会将全局的Vue赋值为Vue实例
    // 保证state具有响应性
    this._vm = new Vue({ // 这里为什么就让state可以在另一个实例中拥有响应性？
      data: { state }
    });
    this.mutations = {};
    this.actions = {};
    this.getters = {};
    this.root = options;
    installModule(this, this.state, options);
  }

  // 属性会被定义在实例的原型上
  // this.state = this._vm.state
  // 每次都会获取到最新的this._vm.state
  get state () {
    return this._vm.state;
  }

  // 通过commit来修改state
  commit = (type, payload) => {
    const entries = this.mutations[type];
    if (entries) {
      entries.forEach(fn => fn(payload));
    }
  };

  dispatch (type, payload) {
    const entries = this.actions[type];
    if (entries) {
      entries.forEach(fn => fn(payload));
    }
  }

  registerModule (rawModule, path) {
    installModule(this, this.state, rawModule, path);
    console.log(this);
  }
}

const Vuex = { install, Store };

export default Vuex;
