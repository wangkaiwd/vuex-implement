<template>
  <div id="app">
    <h3>{{$store.state.age}}</h3>
    <button @click="onAdd">add age</button>
    <button @click="onAsyncAdd"> async add age</button>
    <h2>{{$store.getters.personalInfo}}</h2>
    <h4>{{$store.state.a.age}}</h4>
    <!--    <h4>{{$store.state.a.a2.name}}</h4>-->
    <!--    <button @click="onTestNamespaced">namespaced</button>-->
    <!--    <button @click="changeA2Name">update a2 name</button>-->
    <h1>{{age}}</h1>
  </div>
</template>

<script>
  import { mapState } from './myVuex/helper';

  export default {
    name: 'App',
    components: {},
    computed: {
      ...mapState(['age'])
    },
    methods: {
      onAdd () {
        // this.$store.commit('add', 1);
        this.$store.commit('addSync', 1);
      },
      onAsyncAdd () {
        this.$store.dispatch('asyncAdd', 1);
      },
      onTestNamespaced () {
        this.$store.commit('a/addA', 10);
      },
      changeA2Name () {
        this.$store.commit('a/changeName');
      }
    }
  };
</script>

<style lang="scss">
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
</style>
