### `Vuex`使用
> [`official documentation`](https://vuex.vuejs.org/)

核心配置项：
* `state`
* `getters`
* `mutations`
* `actions`

使用步骤：
```javascript
import App from './App.vue'
import Vue from 'vue'
// 1. import
import Vuex from 'vuex'
Vue.use(Vuex)
// 2. Vue.use
// 3. inject root Vue instance
const store = new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {}
})
new Vue({
  el: '#app',
  store,
  render: (h) => h(App)  
}
```

### `Vuex`基础实现
通过`Vue.use`方法调用`Vuex`，说明`Vuex`会暴露出一个函数或带有`install`方法的`object`。而之后我们通过`new Vuex.Store`来构建`store`实例，所以`Vuex`会导出一个拥有`install`方法以及`Store`类的`object`。代码如下：
```javascript
// myVuex/index.js
const install = (Vue) => {

};

class Store {
  constructor (options) {
    this.options = options;
  }
}

const Vuex = { install, Store };

export default Vuex;
```

之后，我们将`store`注入到了`Vue`的根实例的选项中，组件中便可以这样使用：
```vue
// App.vue
<template>
  <div id="app">
    <h3>{{$store.state.age}}</h3>
  </div>
</template>
```

为了能让`Vue`的所有子组件都能通过`$store`来访问到`store`，进而方便的获取`store`的属性和方法，`Vuex`采用`Vue.mixin`将`store`在`beforeCreate`钩子中进行混入：
```javascript
const install = (Vue) => {
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
```
接下来我们尝试更改`store.state.age`的值。

在`Vuex`中，我们不能直接修改`store.state`的值，而是必须要通过`commit`一个`mutations`，然后通过`mutations`来修改`state`。用法如下：
```vue
<template>
  <div id="app">
    <h3>{{$store.state.age}}</h3>
    <button @click="onAdd">add age</button>
  </div>
</template>

<script>
  export default {
    name: 'App',
    components: {},
    methods: {
      onAdd () {
        this.$store.commit('add', 1);
      }
    }
  };
</script>
```
```javascript
// store/index.js
export default new Vuex.Store({
  // ...
  mutations: {
    add (state, payload) {
      state.age = state.age + payload;
    }
  }
  // ...
});

```
为了方便遍历对象，我们可以实现一个`forEach`方法：
```javascript
// object iterate
const forEach = (obj, cb) => {
  Object.keys(obj).forEach((key) => {
    cb(key, obj[key], obj);
  });
};
```

要通过`commit`方法更新`state`,需要在`Store`类初始化的时候，先缓存所有的`mutations`，然后通过`store`的`commit`方法，传入对应的`key`来执行`mutations`中对应的函数，并且传入`state`以及`commit`调用时的参数`payload`，方便更新`store`的`state`:
```javascript
class Store {
  constructor (options) {
    const { state, mutations } = options;
    // 执行Vue.use会执行install方法，会将全局的Vue赋值为Vue实例
    // 保证state具有响应性
    this._vm = new Vue({ // 这里为什么就让state可以在另一个实例中拥有响应性？
      data: { state }
    });
    this.mutations = {};
    forEach(mutations, (key, mutation) => {
      this.mutations[key] = (payload) => {
        // this.state是不能被更改的
        // 但是这里我们将this._vm.state的地址赋值给了参数state，
        // 之后我们更改的是this._vm.state地址对应的堆内存，而该值是响应式的
        mutation(this.state, payload);
      };
    });
  }

  // 属性会被定义在实例的原型上
  // this.state = this._vm.state
  // 每次都会获取到最新的this._vm.state
  get state () {
    return this._vm.state;
  }

  // 通过commit来修改state
  commit (type, payload) {
    const mutation = this.mutations[type];
    if (mutation) {
      mutation(payload);
    }
  }
}
```

在`Vuex`中，异步更新`state`需要通过`dispatch`方法派发一个`action`，然后通过`action`通过`commit`来修改`state`：
```vue
<template>
  <div id="app">
    <h3>{{$store.state.age}}</h3>
    <button @click="onAsyncAdd"> async add age</button>
  </div>
</template>

<script>
  export default {
    name: 'App',
    components: {},
    methods: {
      onAsyncAdd () {
        this.$store.dispatch('asyncAdd', 1);
      }
    }
  };
</script>
```
```javascript
export default new Vuex.Store({
  // ...
  mutations: {
    add (state, payload) {
      state.age = state.age + payload;
    }
  },
  actions: {
    // const { commit } = store;
    // this指向不一样
    // commit()
    // store.commit()
    asyncAdd ({ commit }, payload) {
      // 这里调用commit时，如果不提前指定this的话，this会指向undefined
      setTimeout(() => {
        commit('add', payload);
      }, 2000);
    }
  },
  // ...
});
```

`Vuex`中`actions`的实现与`mutations`类似，不过在`mutation`中解构出`commit`方法执行时需要我们指定`this`指向：
```javascript
class Store {
  constructor (options) {
    // ...
    this.actions = {};
    forEach(actions, (key, action) => {
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
```

这里我们已经实现了`state`,`mutations`,`actions`，而有时候我们的`state`中的属性过于冗长、或需要计算出一些值，就需要用到`getters`：
```vue

```
```javascript
export default new Vuex.Store({
  state: {
    age: 10,
    person: {
      profile: {
        job: 'developer',
        company: 'alipay',
        name: 'zs'
      },
    }
  },
  getters: {
    personalInfo (state) { // 获取个人信息
      const { profile } = state.person;
      return Object.keys(profile).reduce((prev, cur) => {
        return prev + `${cur}: ${profile[cur]}; `;
      }, '');
    }
  }
  // ...
});
```
