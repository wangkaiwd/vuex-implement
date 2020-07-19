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
  modules: {}
});
