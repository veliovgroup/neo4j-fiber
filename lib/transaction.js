var _helpers = require('./helpers');
var _        = _helpers._;
var events   = _helpers.events;
var __wait   = _helpers.__wait;
var __error  = _helpers.__error;
var Neo4jCursor = require('./cursor');


/*
@locus Server
@summary Implementation of Transactional Cypher HTTP endpoint
         This class is event-driven and all methods is chainable
         Have to be finished by calling `.commit()` or `.rollback()` method
@class Neo4jTransaction
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html
 */
function Neo4jTransaction (_db, settings, opts) {
  var statement;
  var self = this;
  this._db = _db;
  if (opts == null) {
    opts = {};
  }
  events.EventEmitter.call(this);
  this._ready = false;
  this._results = [];
  this.on('transaction', function () {
    var _arguments = arguments;
    var cb = arguments[arguments.length - 1];
    if (self._ready) {
      cb.apply(self, _arguments);
    } else {
      self.once('ready', function () {
        cb.apply(self, _arguments);
      });
    }
  });

  this.on('ready', function () {
    self._ready = true;
  });

  if (settings) {
    statement = this.__prepare(settings, opts);
  }
  if (!statement) {
    statement = {
      request: []
    };
  }

  try {
    var response = this._db.__call(this._db.__service.transaction.endpoint, {
      data: {
        statements: statement.request
      }
    }, 'POST');
    this.__proceedResults(null, response, statement.reactive);
    this._commitURL = response.data.commit;
    this._execURL = response.data.commit.replace('/commit', '');
    this._expiresAt = response.data.transaction.expires;
    this.emit('ready');
  } catch (e) {
    this.__proceedResults(e, null, statement.reactive);
  }
}

Neo4jTransaction.prototype.__proto__ = events.EventEmitter.prototype;

Neo4jTransaction.prototype.__prepare = function (settings, opts, callback, asObj) {
  if (opts == null) {
    opts = {};
  }
  if (asObj == null) {
    asObj = false;
  }

  var _settings = this._db.__parseSettings(settings, opts, callback);
  opts          = _settings.opts;
  callback      = _settings.callback;
  var cypher    = _settings.cypher;
  var reactive  = _settings.reactive;
  var resultDataContents = _settings.resultDataContents;

  var fill = function (cs) {
    return {
      statement: cs,
      parameters: opts,
      resultDataContents: resultDataContents
    };
  };

  var statements = {
    request: [],
    reactive: reactive
  };

  if (_.isArray(cypher)) {
    for (var i = 0; i < cypher.length; i++) {
      statements.request.push(fill(cypher[i]));
    }
  } else if (_.isString(cypher)) {
    statements.request.push(fill(cypher));
  }

  if (asObj) {
    return {
      statements: statements,
      callback: callback
    };
  }
  return statements;
};

Neo4jTransaction.prototype.__commit = function (statement, callback) {
  var data, reactive, self = this;
  if (statement) {
    data = {
      data: {
        statements: statement.request
      }
    };
    reactive = statement.reactive;
  } else {
    data = {
      data: {
        statements: []
      }
    };
    reactive = false;
  }
  return this._db.__call(this._commitURL, data, 'POST', function (error, response) {
    if (statement) {
      self.__proceedResults(error, response, reactive);
    }
    if (callback != null ? callback.return : void 0) {
      callback.return(self._results);
    } else {
      callback(error, self._results);
    }
  });
};

Neo4jTransaction.prototype.__proceedResults = function (error, response, reactive) {
  var self = this;
  if (reactive == null) {
    reactive = false;
  }
  if (!error) {
    self._db.__cleanUpResponse(response, function (result) {
      self._results.push(new Neo4jCursor(self._db.__transformData(result, reactive)));
    });
  } else {
    __error(new Error(error));
  }
};


/*
@locus Server
@summary Rollback an open transaction
@name rollback
@class Neo4jTransaction
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html#rest-api-rollback-an-open-transaction
@returns {undefined}
 */
Neo4jTransaction.prototype.rollback = function () {
  var self = this;
  return __wait(function (_fut) {
    self.emit('transaction', _fut, function (fut) {
      self._db.__call(self._execURL, null, 'DELETE', function () {
        self._results = [];
        fut.return(void 0);
      });
    });
  });
};


/*
@locus Server
@summary Reset transaction timeout of an open Neo4j Transaction
@name resetTimeout
@class Neo4jTransaction
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html#rest-api-reset-transaction-timeout-of-an-open-transaction
@returns Neo4jTransaction
 */
Neo4jTransaction.prototype.resetTimeout = function () {
  var self = this;
  return __wait(function (_fut) {
    self.emit('transaction', _fut, function (fut) {
      self._db.__call(self._execURL, {
        data: {
          statements: []
        }
      }, 'POST', function (error, response) {
        self._expiresAt = response.data.transaction.expires;
        fut.return(self);
      });
    });
  });
};


/*
@locus Server
@summary Execute statement in open Neo4j Transaction
@name execute
@class Neo4jTransaction
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html#rest-api-execute-statements-in-an-open-transaction
@param {Object | String | [String]} settings - Cypher query as String or Array of Cypher queries or object of settings
@param {String | [String]} settings.cypher - Cypher query(ies), alias: `settings.query`
@param {Object}   settings.opts - Map of cypher query(ies) parameters, aliases: `settings.parameters`, `settings.params`
@param {[String]} settings.resultDataContents - Array of contents to return from Neo4j, like: 'REST', 'row', 'graph'. Default: `['REST']`
@param {Boolean}  settings.reactive - Reactive nodes updates on Neo4jCursor.fetch(). Default: `false`. Alias: `settings.reactiveNodes`
@param {Object}   opts - Map of cypher query(ies) parameters
@returns {Neo4jTransaction}
 */
Neo4jTransaction.prototype.execute = function (settings, opts) {
  var self = this;
  if (opts == null) {
    opts = {};
  }
  return __wait(function (_fut) {
    self.emit('transaction', self.__prepare(settings, opts), _fut, function (statement, fut) {
      self._db.__call(self._execURL, {
        data: {
          statements: statement.request
        }
      }, 'POST', function (error, response) {
        self.__proceedResults(error, response, statement.reactive);
        fut.return(self);
      });
    });
  });
};


/*
@locus Server
@summary Commit Neo4j Transaction
@name commit
@class Neo4jTransaction
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html#rest-api-commit-an-open-transaction
@param {Function | Object | String | [String]} settings - Cypher query as String or Array of Cypher queries or object of settings
@param {String | [String]} settings.cypher - Cypher query(ies), alias: `settings.query`
@param {Object}   settings.opts - Map of cypher query(ies) parameters, aliases: `settings.parameters`, `settings.params`
@param {[String]} settings.resultDataContents - Array of contents to return from Neo4j, like: 'REST', 'row', 'graph'. Default: `['REST']`
@param {Boolean}  settings.reactive - Reactive nodes updates on Neo4jCursor.fetch(). Default: `false`. Alias: `settings.reactiveNodes`
@param {Function} settings.callback - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
@param {Object}   opts - Map of cypher query(ies) parameters
@param {Function} callback - Callback function. If passed, the method runs asynchronously.
@returns {[Neo4jCursor]} - Array of Neo4jCursor(s), or empty array if no nodes was returned during Transaction
 */
Neo4jTransaction.prototype.commit = function (settings, opts, callback) {
  var self = this, statements;
  if (opts == null) {
    opts = {};
  }

  if (settings) {
    var _settings  = this.__prepare(settings, opts, callback, true);
    statements     = _settings.statements;
    callback       = _settings.callback;
  }

  if (!callback) {
    return __wait(function (fut) {
      self.emit('transaction', statements, fut, self.__commit);
    });
  }
  this.emit('transaction', statements, callback, this.__commit);
};


/*
@locus Server
@summary Get current data in Neo4j Transaction
@name current
@class Neo4jTransaction
@returns {[Neo4jCursor]} - Array of Neo4jCursor(s), or empty array if no nodes was returned during Transaction
 */
Neo4jTransaction.prototype.current = function () {
  return this._results;
};


/*
@locus Server
@summary Get last received data in Neo4j Transaction
@name last
@class Neo4jTransaction
@returns {Neo4jCursor | null} - Neo4jCursor, or null if no nodes was returned during Transaction
 */
Neo4jTransaction.prototype.last = function () {
  if (this._results.length > 0) {
    return this._results[this._results.length - 1];
  }
  return null;
};

module.exports = Neo4jTransaction;
