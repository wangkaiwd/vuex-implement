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
const store = {
  state: {},
  getters: {},
  mutations: {},
  actions: {}
}
new Vue({
  el: '#app',
  store,
  render: (h) => h(App)  
}

```
