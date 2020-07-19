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
