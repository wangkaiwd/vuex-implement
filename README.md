## `Vuex`源码解析
在正式阅读`Vuex`源码之前，我们先实现一个简易版的`Vuex`来帮助我们理解

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

### `Vuex`的`install`方法
`Vuex`的使用方式：
1. 引入`Vuex`
2. `Vue.use(Vuex)`
3. `new Vuex.Store`创建`Vuex`中`Store`的实例
4. 在`Vue`根实例中作为配置项注入

[`Vue.use`](https://vuejs.org/v2/api/#Vue-use) 方法的参数要求时一个函数或者具有`install`方法的对象，由上述的使用步骤`1~3`可以得出，`Vuex`会默认导出一个具有`install`方法以及`Store`类的对象，代码如下：
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

步骤4中，我们将`store`注入到了`Vue`的根实例的选项中，组件中便可以这样使用：
```vue
// App.vue
<template>
  <div id="app">
    <h3>{{$store.state.age}}</h3>
  </div>
</template>
```

为了能让`Vue`的所有子组件都能通过`$store`来访问到`store`，进而方便的获取`store`的属性和方法，`Vuex`采用`Vue.mixin`将`store`在`beforeCreate`钩子中进行全局混入：
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

### 响应式的`state`
这样我们便能在所有的注入`store`配置的根组件及其所有子组件中使用`$store`

**直接为`Vue`的实例添加属性，该属性值是不具备响应性的。**

此时`state`虽然可以获取到，但是由于并没有提前在`data`中定义，所以并不是响应式的，即在`state`发生变化时，视图并不会随之更新。为了让`state`成为响应式，我们在`Vuex`内部创建了一个新的`Vue`实例，并将`state`作为实例的`data`中的属性，保持其响应性
```javascript
class Store {
  constructor (options) {
    const { state} = options;
    // 执行Vue.use会执行install方法，会将全局的Vue赋值为Vue实例
    // 保证state具有响应性
    this._vm = new Vue({ // 这里为什么就让state可以在另一个实例中拥有响应性？
      data: { state }
    });
  }

  // 属性会被定义在实例的原型上
  // this.state = this._vm.state
  // 每次都会获取到最新的this._vm.state
  get state () {
    return this._vm.state;
  }
}
```
`Vuex`与全局变量一个最大的局别在于：**`Vuex`中`store`的`state`是响应式的，在`state`发生变化时可以保证视图有效更新**

### `mutation`同步更改`state`
接下来我们尝试更改`store.state.age`的值。

在`Vuex`中，我们不能直接修改`store.state`的值，而是必须要通过`commit`一个`mutation`，然后通过`mutation`来修改`state`。用法如下：
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
### `action`处理异步任务
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

### `Vuex`中的`getters`
这里我们已经实现了`state`,`mutations`,`actions`，而有时候我们的`state`中的属性过于冗长、或需要计算出一些值，就需要用到`getters`：
```vue
<template>
  <div id="app">
    <h2>{{$store.getters.personalInfo}}</h2>
  </div>
</template>
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
到这里我们已经实现了一个简易版的`Vuex`，可以通过`state`来获取数据、通过`mutation`同步更改`state`、通过`action`来处理异步行为。这只是源码的核心逻辑简化，接下来我们深入解读一下`Vuex`源码。

### `Vuex`源码目录结构
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20200727002457.png)
> 下面我们只摘出源码中的核心代码进行解读，具体细节需要读者去源码中寻找

### 所有组件都可以访问`$store`
源码中的`install`方法与我们的实现基本上是相同的，代码如下：
```javascript
// store.js
export function install (_Vue) {
  Vue = _Vue
  applyMixin(Vue)
}

// mixin
export default function applyMixin (Vue) {
  Vue.mixin({ beforeCreate: vuexInit })
  /**
   * Vuex init hook, injected into each instances init hooks list.
   */
  function vuexInit () {
    const options = this.$options
    // store injection
    // 自上而下将根实例中传入的VuexStore实例store注入到所有组件的实例上
    if (options.store) {
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store
    } else if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store
    }
  }
}
```

![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20200727004339.png)

子组件在调用`beforeCreate`函数时，都会使用其父组件的`$store`属性作为自己的`$store`属性，而根实例会在实例化时我们手动传入`store`属性。这样实现了每个组件都会拥有`$store`属性

### 依赖收集
在`Vuex`中可以将`state,actions,mutatoins`等属性根据模块进行划分，方便代码的维护。

在`Store`拿到了用户传入的配置项之后，首先进行的操作是模块收集，其目的是将用户的传入的配置项处理为更加方便的树形结构

用户传入：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/202007222227011451.png)

处理之后：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/20200727010214.png)

```javascript
// store.js
export class Store {
  constructor (options = {}) {
      // some code ...
      this._modules = new ModuleCollection(options);
      // some code ...
    }
}
```
```javascript
// module-collection.js
export default class ModuleCollection {
  constructor (rawRootModule) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false)
  }
 
  register (path, rawModule, runtime = true) {
    // 格式化用户配置项，并为每个模块原型上添加一些公有方法，方便调用
    const newModule = new Module(rawModule, runtime);
    // 处理根模块
    if (path.length === 0) {
      this.root = newModule;
    } else { // 处理子模块
      // 通过path找到父模块
      const parent = this.get(path.slice(0, -1));
      // 将父模块的子模块赋值为当前遍历的模块，key为path的最后一项
      parent.addChild(path[path.length - 1], newModule);
      // parent._children[path[path.length-1]] = newModule
    }

    // register nested modules
    if (rawModule.modules) { // 递归处理子模块
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime);
      });
    }
  }
}
```
到这里我们将配置项处理为了比较方便的结构：
```javascript
{ root: {state: {},_children:{}, _rawModule: {}} }
```
并且每个模块也通过`Module`类提供了一些原型方法方便调用。

### 模块安装
通过模块收集将用户传入的选项处理为我们方便使用的树形结构后，需要为`store`实例添加用户要使用的`state, getters, mutations, actions`。

首先我们通过下图大概看一下`Vuex`整个安装模块的具体流程
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/2020-7-29-1%3A02.png)


源码中通过`installModule`来递归的生成`store`实例需要的属性：
```javascript
export class Store {
  constructor (options = {}) {
    // ...
    // 模块收集
    this._modules = new ModuleCollection(options);
    const state = this._modules.root.state;

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    // 模块安装
    installModule(this, state, [], this._modules.root);
  }
}
```
```javascript
function installModule (store, rootState, path, module, hot) {
  // 当path为空数组时，遍历的是根模块
  const isRoot = !path.length;
  // 根据path获取当前遍历模块的命名空间namespace
  const namespace = store._modules.getNamespace(path);
  // register in namespace map
  if (module.namespaced) {
    if (store._modulesNamespaceMap[namespace] && __DEV__) {
      console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`);
    }
    // 在store上存储模块命名空间的映射，key为namespace,value为module
    // 每个模块都应该有自己单独的命名空间，方便检查命名空间是否重复并提醒用户
    store._modulesNamespaceMap[namespace] = module;
  }
  // set state
  if (!isRoot && !hot) {
    // 根据根state以及path找到对应的父state
    const parentState = getNestedState(rootState, path.slice(0, -1));
    // path的最后一项为当前处理的模块名
    const moduleName = path[path.length - 1];
    store._withCommit(() => {
      // 保证为state赋值时，值为响应式
      Vue.set(parentState, moduleName, module.state);
      // state => this._modules.root.state
      // store._vm = new Vue({
      //    data: {
      //        $$state: state
      //    }
      // })
      // store.state => store._vm._data.$$state
      // 所以store.state和state即this._modules.root.state指向同一片堆内存空间，堆内存的键值对发生变化时，会同步更新
    });
  }
  // 生成当前模块的state,getters,commit,dispatch
  // 方便之后在注册mutation,action,getter时使用当前模块的一些属性和方法：
  // 如在action中可以使用局部的commit,dispatch来调用当前模块的mutation和action
  const local = module.context = makeLocalContext(store, namespace, path);

  // 为store设置mutations
  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);
  });

  module.forEachAction((action, key) => {
    const type = action.root ? key : namespace + key;
    const handler = action.handler || action;
    registerAction(store, type, handler, local);
  });

  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);
  });

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot);
  });
}
```
`installModule`方法做了以下事情：
* 计算当前模块的命名空间
* 生成`this._module.root.state`并具有响应式
* 注册`mutations`
* 注册`actions`
* 注册`getters`
* 继续递归注册

在执行完成`installModule`后，`store`大概结构如下：
```javascript
const store = {
  "_mutations": {
    "cart/pushProductToCart": [
      function handler() {}
    ],
  },
  "_actions": {
    "cart/addProductToCart": [
      function handler() {}
    ],
  },
}
```
需要注意的是，此时并没有将`state`和`getters`关联到`store`中，真正将其关联的方法在`resetStoreVM`中：
```javascript
function resetStoreVM (store, state, hot) {
  // bind store public getters
  store.getters = {};
  // reset local getters cache
  store._makeLocalGettersCache = Object.create(null);
  const wrappedGetters = store._wrappedGetters;
  const computed = {};
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure environment.
    // 将getter放到计算属性中
    computed[key] = partial(fn, store);
    // store.getters中的属性从store中创建的 vue instance 中获取
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    });
  });

  // 通过创建Vue实例，然后将store.state定义在Vue的data中，保证state的响应性
  // 将getters放入到计算属性中，在从getters中取值时会从store._vm中获取
  store._vm = new Vue({
    data: {
      // 以_或者$开头的属性，将不会被代理在Vue实例上，因为它们可能与Vue内部的属性和API方法发生冲突
      // 您必须像vm.$data._property一样访问它们
      $$state: state
    },
    computed
  });
  Vue.config.silent = silent;

  // enable strict mode for new vm
  if (store.strict) {
    // 启用严格模式，当通过mutation异步更改state时会报错
    enableStrictMode(store);
  }
}
```
在`store`中我们使用`get`语法来定义`state`: 
```javascript
class Store {
  // ...
  get state () {
    return this._vm._data.$$state;
  }
  // ...
}
```
```javascript
const state = this._modules.root.state;

store._vm = new Vue({
  data: {
    // 以_或者$开头的属性，将不会被代理在Vue实例上，因为它们可能与Vue内部的属性和API方法发生冲突
    // 您必须像vm.$data._property一样访问它们
    $$state: state
  },
  computed
});
```
这样我们获取`store.state`的值时，相当于从`this._modules.root.state`中获取值，通过`Vue`当中间层，实现了`state`的响应式，保证数据和视图的同步更新

### `Store`提供的方法
`Store`中提供的最常用的方法是`commit`和`dispatch`，分别用来提交`mutation`和派发`action`。它们与`state`和组件之间的关系如下：
![](https://raw.githubusercontent.com/wangkaiwd/drawing-bed/master/202444400729213954.png)
#### `commit`
`commit`方法的主要逻辑是根据传入的`type`来执行对应的所有`mutations`中的用户传入的函数
```javascript
commit (_type, _payload, _options) {
  // check object-style commit
  const {
    type,
    payload,
    options
  } = unifyObjectStyle(_type, _payload, _options);

  // 插件调用subscribe方法是回调函数的参数
  const mutation = { type, payload };
  const entry = this._mutations[type];
  if (!entry) {
    if (__DEV__) {
      console.error(`[vuex] unknown mutation type: ${type}`);
    }
    return;
  }
  // 用_withCommit包裹来判断是否同步更改state
  this._withCommit(() => {
    // commit时调用mutation,参数为payload
    entry.forEach(function commitIterator (handler) {
      handler(payload);
    });
  });

  // 调用commit更改state时，调用所有插件中订阅的方法
  this._subscribers
    .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
    .forEach(sub => sub(mutation, this.state));
}
```
上述代码中，我们看到`Vuex`并没有直接执行`mutations`中的函数，而是通过将执行过程放入函数中，并作为参数传到了`_withCommit`方法中。下面我们看看`_withCommit`方法做了些什么
```javascript
class Store {
  construtor() {
    // ... some code
    this._committing = false;
  }

  _withCommit (fn) {
    const committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
  }
}

// 启用严格模式
function enableStrictMode (store) {
  // 该操作是十分昂贵的，所以需要在生产环境禁用
  // 同步深度监听store中state的变化，当state改变没有通过mutation时，会抛出异常
  store._vm.$watch(function () { return this._data.$$state; }, () => {
    if (__DEV__) {
      assert(store._committing, `do not mutate vuex store state outside mutation handlers.`);
    }
  }, { deep: true, sync: true });
}
```
在开启严格模式后，`store`将会利用`Vue`提供的`$watch`方法深度同步监听`this._data.$$state`的变化，也就是在`store`的`state`发生变化时立即触发第二参数回调函数。

如果`mutations`会异步更改`state`,那么在异步更改`state`之前会先执行`this._committing = false`。此时`assert(store.__committing)`会由于断言失败，进行提示。当`mutations`同步更改`state`时，在`state`更改完成后，才会将`this._committing`更改为`false`，`assert(store._committing)`会一直断言成功，不会进行提示。
#### `dispatch`

### 动态注册

### 插件机制

### 辅助函数
