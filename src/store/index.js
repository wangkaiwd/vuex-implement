import Vue from 'vue';
import Vuex from '../myVuex';
// import Vuex from 'vuex';
// import { createLogger } from 'vuex';

Vue.use(Vuex);

// A Vuex plugin is simply a function that receives the store
// as the only arguments
function logger (store) {
  let prevState = JSON.parse(JSON.stringify(store.state));
  store.subscribe((mutation, state) => {
    console.log('prevState', prevState);
    const nextState = JSON.parse(JSON.stringify(state));
    console.log('nextState', nextState);
    prevState = nextState;
  });
}

export default new Vuex.Store({
  plugins: [logger],
  strict: true,
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
      setTimeout(() => {
        state.age = state.age + payload;
      }, 1000);
    },
    addSync (state, payload) {
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
        commit('addSync', payload);
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
