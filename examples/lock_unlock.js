"use strict";
var mutexes = require('../index.js')

mutexes.init_session().then(
  (Mutex) => {
    var mutex = new Mutex('ns', 'id');
    return mutex;
  }
).then(
  (mutex) => {
    return mutex.lock();
  }
).then(
  (mutex) => {
    console.log(mutex.result); // TODO populate
    console.log('Do your thing');
    return mutex.unlock();
  },
  (mutex) => {
    console.log(mutex.error); // TODO populate
    console.log('Could not lock mutex');
    return mutex;
  }
).then(
  (mutex) => mutex.session.close()
);
