# How to use

```js
const ref = firebase.database().ref('/database/path');
/** @type {Observable} - list is a RxJs Observable */
const list = observeFirebaseList(ref, {
  all: {
    init: () => {
      return {total: 0}
    },
    reduce: (result, item) => {
      result.total += item.value;
      return result;
    }
  },
  milk: {
    init: () => {
      return {total: 0, count: 0}
    },
    test: item => item.category === 'milk',
    reduce: (result, item) => {
      result.total += item.value;
      result.count += 1;
      return result;
    },
    after: result => {
      result.avg = result.total / result.count;
      return result;
    }
  }
})

const subscription = list.subscribe(x => console.log(x))
// subscription.unsubscribe()
```
