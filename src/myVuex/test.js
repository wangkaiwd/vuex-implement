class Test {
  constructor () {
    this.obj = { a: 1 };
  }

  get a () {
    return this.obj;
  }
}

const test = new Test();
