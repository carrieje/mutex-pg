var testCase  = require('nodeunit').testCase;
var mutexes = require('./index.js')

lock_the_mutex = function (test, mutex, succeeds) {
  return mutex.lock().then(
    (m) => Promise.resolve(succeeds),
    (m) => Promise.resolve(!succeeds)
  ).then(
    (res) => {
      var msg = succeeds ? 'Should have locked the mutex' : "Should'nt have locked the mutex";
      test.ok(res, msg);
      return Promise.resolve(mutex);
    }
  );
}

unlock_the_mutex = function (test, mutex, succeeds) {
  return mutex.unlock().then(
    (m) => Promise.resolve(succeeds),
    (m) => Promise.resolve(!succeeds)
  ).then(
    (res) => {
      var msg = succeeds ? 'Should have unlocked the mutex' : "Should'nt have unlocked the mutex";
      test.ok(res, msg);
      return Promise.resolve(mutex);
    }
  );
}

module.exports = testCase({
  setUp: function(callback) {
    mutexes.init_session().then(
      (Mutex) => {
        return new Mutex(null, null);;
      }
    ).then(
      (mutex) => mutex.truncate_table()
    ).then(
      (mutex) => mutex.session.close()
    ).then(
      () => callback()
    );
  },

  "Lock a mutex succeeds": function(test) {
    test.expect(1);
    mutexes.init_session().then(
      (Mutex) => {
        return new Mutex('my_program', 'my_loop_1');;
      }
    ).then(
      (mutex) => lock_the_mutex(test, mutex, true)
    ).then(
      (mutex) => mutex.session.close()
    ).then(
      () => test.done()
    );
  },

  "Lock twice the same mutex fails": function(test) {
    test.expect(2);
    mutexes.init_session().then(
      (Mutex) => {
        return new Mutex('my_program', 'my_loop_1');;
      }
    ).then(
      (mutex) => lock_the_mutex(test, mutex, true)
    ).then(
      (mutex) => lock_the_mutex(test, mutex, false)
    ).then(
      (mutex) => mutex.session.close()
    ).then(
      () => test.done()
    );
  },

  "Unlock a free mutex succeeds": function(test) {
    test.expect(1);
    mutexes.init_session().then(
      (Mutex) => {
        return new Mutex('my_program', 'my_loop_1');;
      }
    ).then(
      (mutex) => unlock_the_mutex(test, mutex, true)
    ).then(
      (mutex) => mutex.session.close()
    ).then(
      () => test.done()
    );
  },

  "Mutex unlock allows to lock it again": function(test) {
    test.expect(3);
    mutexes.init_session().then(
      (Mutex) => {
        return new Mutex('my_program', 'my_loop_1');;
      }
    ).then(
      (mutex) => lock_the_mutex(test, mutex, true)
    ).then(
      (mutex) => unlock_the_mutex(test, mutex, true)
    ).then(
      (mutex) => lock_the_mutex(test, mutex, true)
    ).then(
      (mutex) => mutex.session.close()
    ).then(
      () => test.done()
    );
  }
});
