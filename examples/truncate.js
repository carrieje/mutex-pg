"use strict";
var mutexes = require('../index.js')

mutexes.init_session().then(
  (Mutex) => {
    var mutex = new Mutex('ns', 'id');
    return mutex.truncate_table();
  }
).then(
  (mutex) => {
    console.log('Table truncated.');
    return mutex;
  },
  (mutex) => {
    console.log('Could not truncate table.');
    return mutex;
  }
).then(
  (mutex) => mutex.session.close()
);
