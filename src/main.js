import Vue from 'vue';
import App from './App.vue';
import store from './store';

Vue.config.productionTip = false;
// store.registerModule({
//   state: { name: 'name-a2' },
//   mutations: {
//     changeName (state) {
//       state.name = state.name + 'a';
//     }
//   }
// }, ['a', 'a2']);
new Vue({
  store,
  render: h => h(App)
}).$mount('#app');
