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

