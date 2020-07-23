import Vue from 'vue';
import Vuex from '../myVuex';
// import Vuex from 'vuex';

Vue.use(Vuex);

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
  },
  mutations: {
    add (state, payload) {
      state.age = state.age + payload;
    },
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
  modules: {
    a: {
      namespaced: true,
      state: {
        name: 'name-a',
        age: 10,
        person: {
          gender: 'man'
        }
      },
      mutations: {
        addA (state, payload) {
          console.log('add a');
          state.age = state.age + payload;
        }
      },
      getters: {
        nameA (state) {
          return state.person.gender;
        }
      },
      modules: {
        a1: {
          state: {
            name: 'name-a1'
          },
          modules: {
            a11: {
              state: {
                name: 'name-a11'
              }
            }
          }
        }
      }
    },
    b: {
      state: {
        name: 'name-b',
        person: {
          hobby: 'game',
        }
      },
      mutations: {
        nameB (state) {

        }
      }
    }
  }
});
