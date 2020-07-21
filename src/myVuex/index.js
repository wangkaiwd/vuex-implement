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
  // 遍历current没有意义，还是需要再次判断各个属性来进行不同的操作
  forEach(current.mutations, (mutation, key) => {
    const entry = store.mutations[key] = store.mutations[key] || [];
    entry.push((payload) => {
      mutation(current.state, payload);
    });
  });
  forEach(current.actions, (action, key) => {
    const entry = store.actions[key] = store.actions[key] || [];
    entry.push((payload) => {
      action(store, payload);
    });
  });
  forEach(current.getters, (getter, key) => {
    Object.defineProperty(store.getters, key, {
      get: () => {
        return getter(current.state);
      }
    });
  });
  // {state: {a: 1}, modules: {x: {state: {b:2}}}}
  // {state: {a:1, x: {b:2}}}
  // 需要通过path来记录state所在module的key，然后拼到store的state上
  // path = [a]  store.state.a = state
  // path = [a, a1] store.state.a.a1 = state
  if (path.length === 0) {
    rootState = current.state;
  } else {
    // 根模块
    // 处理对象：
    // 将modules的key在每次递归时放入到数组中，
    // 这样可以很方便的通过数组来找到当前遍历的内容在原对象的位置，
    // 并且可以为新对象赋值
    // 处理数组：
    // var tree = [
    //  {
    //    state: '1',
    //    children: [{state:'1-1'}] },
    //    {state: '2', children: [{state: '2-2'}]}
    // ]
    // path: [0] path中记录的是父级数组对应的索引，当前数组对应的索引可以通过遍历时获得
    // 然后通过所有父级的索引拼接当前数组的索引可以找到对应的元素
    const parent = path.slice(0, -1).reduce((prev, cur) => {
      return prev[cur];
    }, rootState);
    const latestKey = path[path.length - 1];
    parent[latestKey] = current.state;
  }
  forEach(current.modules, (module, key) => {
    installModule(store, rootState, module, path.concat(key));
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
    this.mutations = {};
    this.actions = {};
    this.getters = {};
    // 注意： 由于 get state() {...}
    // 所以不能直接修改this.state,
    // 这里将this.state作为参数传入函数，会进行形参赋值，
    // 将this.state返回的this._vm.state的地址赋值给rootState，
    // 而之后更改rootState会更改其与this_vm.state共享的堆内存，
    // 最终通过this.state获取到最新的state的值
    installModule(this, this.state, options);
    // this.getters = {};
    // forEach(getters, (getter, key) => {
    //   // 每次取值时都会调用get方法
    //   // 而computed方法只会在
    //   Object.defineProperty(this.getters, key, {
    //     get: () => {
    //       return getter(this.state);
    //     }
    //   });
    // });
    // console.log('store', this);
    // this.mutations = {};
    // forEach(mutations, (mutation, key) => {
    //   this.mutations[key] = (payload) => {
    //     // this.state是不能被更改的
    //     // 但是这里我们将this._vm.state的地址赋值给了参数state，
    //     // 之后我们更改的是this._vm.state地址对应的堆内存，而该值是响应式的
    //     mutation(this.state, payload);
    //   };
    // });
    // this.actions = {};
    // forEach(actions, (action, key) => {
    //   this.actions[key] = (payload) => {
    //     // action中的第一个参数为Store的实例，可以通过commit来更改state
    //     // 也可以通过dispatch来派发另一个action
    //     action(this, payload);
    //   };
    // });
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
}

const Vuex = { install, Store };

export default Vuex;
