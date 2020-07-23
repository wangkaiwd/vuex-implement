<template>
  <div id="app">
    <h3>{{$store.state.age}}</h3>
    <button @click="onAdd">add age</button>
    <button @click="onAsyncAdd"> async add age</button>
    <h2>{{$store.getters.personalInfo}}</h2>
    <h4>{{$store.state.a.age}}</h4>
    <button @click="onTestNamespaced">namespaced</button>
  </div>
</template>

<script>
  export default {
    name: 'App',
    components: {},
    methods: {
      onAdd () {
        this.$store.commit('add', 1);
      },
      onAsyncAdd () {
        this.$store.dispatch('asyncAdd', 1);
      },
      onTestNamespaced () {
        this.$store.commit('a/addA', 10);
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
