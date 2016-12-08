"use strict";
var pg = require('pg')

class ConnectionManager {
  constructor() {
    var config = {
      max: 1,                   // Max number of clients in the pool
      idleTimeoutMillis: 30000, // Allowed to remain idle before being closed
    };
    this.client = new pg.Client(config);
    this.client.connect(function(err) {
      if (err) {
        console.error('error connecting client', err);
      }
    });
  }

  execute(query_text, parameters) {
    return function(mutex) {
      var query = { text: query_text, values: parameters }
      return new Promise((resolve, reject) => {
        this.client.query(query, function(err, result) {
          if (err) {
            reject(mutex);
          }
          resolve(mutex);
        });
      })
    }.bind(this);
  };

  terminate() {
    this.client.end(function(err) {
      if (err) {
        console.log(err);
      }
    });
  }
}

var initialize = function() {
  const TABLE = 'mutexes';

  var queries_text = {
    LIST_MUTEXES: `SELECT * FROM ${TABLE}`,
    COUNT_MUTEXES: `SELECT COUNT(*) AS number FROM ${TABLE}`,
    LOCK_MUTEX: `INSERT INTO ${TABLE}(namespace,identifier) VALUES ($1,$2)`,
    UNLOCK_MUTEX: `DELETE FROM ${TABLE} WHERE namespace=$1 AND identifier=$2`,
    TRUNCATE_TABLE: `TRUNCATE ${TABLE}`
  };

  class Mutex {
    constructor(namespace, identifier) {
      this.namespace = namespace;
      this.identifier = identifier;
    }

    //---------------------------------------
    // NOTE : For testing purposes only
    truncate_table() {
      return Mutex.connection_manager.execute(queries_text.TRUNCATE_TABLE, null)(this);
    }
    count_mutexes(on_success) {
      return Mutex.connection_manager.execute(queries_text.COUNT_MUTEXES, null)(this);
    }
    //---------------------------------------

    lock() {
      return Mutex.connection_manager.execute(queries_text.LOCK_MUTEX, [this.namespace, this.identifier])(this);
    }

    unlock() {
      return Mutex.connection_manager.execute(queries_text.UNLOCK_MUTEX, [this.namespace, this.identifier])(this);
    }
  };
  Mutex.connection_manager = new ConnectionManager();
  module.exports.terminate = Mutex.connection_manager.terminate.bind(Mutex.connection_manager);

  return Mutex;
};
module.exports.initialize = initialize;

var init_session = function() {
  return new Promise((resolve, reject) => {
    var Mutex = initialize();
    var session = { close: Mutex.connection_manager.terminate.bind(Mutex.connection_manager) };
    Mutex.prototype.session = session;
    // TODO Handle connection errors
    resolve(Mutex);
  });
}
module.exports.init_session = init_session;
