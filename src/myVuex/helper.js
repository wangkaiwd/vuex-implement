// Reduce the code which written in Vue.js for getting state
export function mapState (array) {
  const result = {};
  array.forEach(key => {
    // computed调用函数时会指定this为Vue实例
    result[key] = function () { return this.$store.state[key]; };
  });
  return result;
}
