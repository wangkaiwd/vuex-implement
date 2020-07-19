import Vue from 'vue';
import Vuex from '../myVuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    age: 10
  },
  mutations: {
    add (state, payload) {
      state.age = state.age + payload;
    }
  },
  actions: {},
  modules: {}
});
