## 问题记录
* 为什么`new Vue({data: {state}})`可以使`state`具备响应式，而且可以知道如何去更新视图？
* `CollectionModule`的真正作用是什么，假如没有的话该如何实现？

### 与源代码的对比
* [获取`mutations`的命名空间字符串](https://github.com/vuejs/vuex/blob/0e4d97f2e02b64dd6f955685fa368bde4c3dcf8f/src/module/module-collection.js#L16-L22)
* [获取`store`中嵌套的`state`](https://github.com/vuejs/vuex/blob/0e4d97f2e02b64dd6f955685fa368bde4c3dcf8f/src/store.js#L521-L523)
