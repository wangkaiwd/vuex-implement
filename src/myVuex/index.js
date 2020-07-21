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
  Object.keys(obj).forEach((key) => {
    cb(obj[key], key, obj);
  });
};
const installModule = (store, rootModule, current = rootModule) => {
  store._mutations = store._mutations || {};
  store._actions = store._actions || {};
  store._state = store._state || {};
  forEach(current, (module, key) => {
    if (key === 'mutations') {
      forEach(module, (mutation, key) => {
        const entry = store._mutations[key] = store._mutations[key] || [];
        entry.push((payload) => {
          mutation(module.state, payload);
        });
      });
    } else if (key === 'actions') {
      forEach(module, (action, key) => {
        const entry = store._actions[key] = store._actions[key] || [];
        entry.push((payload) => {
          action(store, payload);
        });
      });
    } else if (key === 'state') { // 需要将不同module的state拼接到store.state上
      // {
      //    state: {name: 'root'},
      //    modules: {
      //      a: {
      //        state: {
      //          name: 'a'
      //        },
      //      }
      //    }
      // }
      // {
      //    state: { name: 'root', a:{ name: 'a' } }
      // }
      // store._state = module
    }
    if (key === 'modules') {
      forEach(module, (current) => {
        installModule(store, rootModule, current);
      });
    }
  });
};

class Store {
  constructor (options) {
    const { state, mutations, actions, getters } = options;
    // 执行Vue.use会执行install方法，会将全局的Vue赋值为Vue实例
    // 保证state具有响应性
    this._vm = new Vue({ // 这里为什么就让state可以在另一个实例中拥有响应性？
      data: { state }
    });
    this.getters = {};
    forEach(getters, (getter, key) => {
      // 每次取值时都会调用get方法
      // 而computed方法只会在
      Object.defineProperty(this.getters, key, {
        get: () => {
          return getter(this.state);
        }
      });
    });
    installModule(this, options);
    console.log('store', this);
    this.mutations = {};
    forEach(mutations, (mutation, key) => {
      this.mutations[key] = (payload) => {
        // this.state是不能被更改的
        // 但是这里我们将this._vm.state的地址赋值给了参数state，
        // 之后我们更改的是this._vm.state地址对应的堆内存，而该值是响应式的
        mutation(this.state, payload);
      };
    });
    this.actions = {};
    forEach(actions, (action, key) => {
      this.actions[key] = (payload) => {
        // action中的第一个参数为Store的实例，可以通过commit来更改state
        // 也可以通过dispatch来派发另一个action
        action(this, payload);
      };
    });
    // 通过bind返回一个函数赋值为this.commit，该函数内部会通过call执行this.commit，
    // 并且会将返回函数的参数也传入this.commit
    // 等号右边 => Store.prototype.commit 原型方法
    // 等到左边 => store.commit 实例私有方法
    // this.commit = this.commit.bind(this);
  }

  // 属性会被定义在实例的原型上
  // this.state = this._vm.state
  // 每次都会获取到最新的this._vm.state
  get state () {
    return this._vm.state;
  }

  // 通过commit来修改state
  commit = (type, payload) => {
    const mutation = this.mutations[type];
    if (mutation) {
      mutation(payload);
    }
  };

  dispatch (type, payload) {
    const action = this.actions[type];
    if (action) {
      action(payload);
    }
  }
}

const Vuex = { install, Store };

export default Vuex;
