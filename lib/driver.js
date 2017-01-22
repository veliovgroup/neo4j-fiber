var _helpers = require('./helpers');
var _ = _helpers._;
var URL = _helpers.URL;
var bound = _helpers.bound;
var Fiber = _helpers.Fiber;
var events = _helpers.events;
var needle = _helpers.needle;
var __wait = _helpers.__wait;
var __error = _helpers.__error;
var NTRU_def = _helpers.NTRU_def;
var __success = _helpers.__success;

var _check = require('./check');
var check  = _check.check;
var Match  = _check.Match;

var Neo4jNode = require('./node');
var Neo4jData = require('./data');
var Neo4jCursor = require('./cursor');
var Neo4jEndpoint = require('./endpoint');
var Neo4jTransaction = require('./transaction');
var Neo4jRelationship = require('./relationship');


/*
@locus Server
@summary Connector to Neo4j, with basic Neo4j REST API methods implementation
@class Neo4jDB
 */
function Neo4jDB(url, opts) {
  var tasks, _eb;
  var self = this;
  this.url = url;
  if (opts == null) {
    opts = {};
  }
  events.EventEmitter.call(this);
  this.url = this.url || process.env.NEO4J_URL || process.env.GRAPHENEDB_URL || 'http://localhost:7474';
  check(this.url, String);
  check(opts, Object);
  opts.password = opts.password || opts.pass || '';
  check(opts.password, String);
  opts.username = opts.username || opts.user || '';
  check(opts.username, String);
  this.base = opts.base || opts.root || opts.path || 'db/data';
  this.base = this.base.replace(/^\/|\/$/g, '');
  this.root = this.url + '/' + this.base;
  this.https = !!~this.url.indexOf('https://');
  check(this.base, String);
  if (this.https) {
    this.username = opts.username;
    this.password = opts.password;
  }
  this.__service = {};
  this._ready = false;
  this.defaultHeaders = {
    Accept: 'application/json; charset=UTF-8',
    'X-Stream': 'true',
    'Content-Type': 'application/json'
  };
  if (opts != null ? opts.headers : void 0) {
    this.defaultHeaders = _.extend(this.defaultHeaders, opts.headers);
  }
  if (opts.password && opts.username) {
    this.defaultHeaders.Authorization = 'Basic ' + (new Buffer(opts.username + ':' + opts.password).toString('base64'));
  }
  this.on('ready', function() {
    self._ready = true;
  });

  this.on('batch', this.__request);
  tasks = [];

  _eb = function() {
    self.emit('batch', tasks);
    tasks = [];
  };

  this.on('query', function(task) {
    task.to = task.to.replace(self.root, '');
    if (task.id == null) {
      task.id = Math.floor(Math.random() * (999999999 - 1 + 1) + 1);
    }

    tasks.push(task);
    if (self._ready) {
      process.nextTick(function() {
        if (tasks.length > 0) {
          _eb();
        }
      });
    } else {
      self.once('ready', function() {
        process.nextTick(function() {
          if (tasks.length > 0) {
            _eb();
          }
        });
      });
    }
  });
  this.__connect();
  this.relationship._db = this;
  this.index._db = this;
  this.constraint._db = this;
}

Neo4jDB.prototype.__proto__ = events.EventEmitter.prototype;

Neo4jDB.prototype.__request = function(tasks) {
  var self = this;
  return this.__call(this.__service.batch.endpoint, {
    data: tasks,
    headers: this.defaultHeaders
  }, 'POST', function(error, response) {
    if (!error) {
      return self.__cleanUpResponse(response, function(result) {
        return self.__proceedResult(result);
      });
    } else {
      return __error(new Error(error));
    }
  });
};

Neo4jDB.prototype.__cleanUpResponse = function(response, cb) {
  if ((response != null ? response.data : void 0) && _.isObject(response.data)) {
    return this.__cleanUpResults(response.data, cb);
  } else if ((response != null ? response.content : void 0) && _.isString(response.content)) {
    try {
      return this.__cleanUpResults(JSON.parse(response.content), cb);
    } catch (e) {
      __error('Neo4j response error (Check your cypher queries):', [response.statusCode], e);
      __error('Originally received data:');
    }
  } else {
    __error('Empty response from Neo4j, but expecting data');
  }
};

Neo4jDB.prototype.__cleanUpResults = function(results, cb) {
  var error, errors, result, _i, _j, _len, _len1, _results, _results1;
  if ((results != null ? results.results : void 0) || (results != null ? results.errors : void 0)) {
    errors = results != null ? results.errors : void 0;
    results = results != null ? results.results : void 0;
  }
  if (!_.isEmpty(errors)) {
    _results = [];
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      _results.push(__error(error.code, error.message));
    }
    return _results;
  } else if (!_.isEmpty(results)) {
    _results1 = [];
    for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
      result = results[_j];
      _results1.push(cb(result));
    }
    return _results1;
  }
};

Neo4jDB.prototype.__proceedResult = function(result) {
  var error, _i, _len, _ref2, _ref3;
  if (result != null ? result.body : void 0) {
    if (_.isEmpty((_ref2 = result.body) != null ? _ref2.errors : void 0)) {
      return this.emit(result.id, null, result.body, result.id);
    } else {
      _ref3 = result.body.errors;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        error = _ref3[_i];
        __error(error.message);
        __error('code: ', error.code);
      }
      return this.emit(result.id, error != null ? error.message : void 0, [], result.id);
    }
  } else {
    return this.emit(result.id, null, [], result.id);
  }
};

Neo4jDB.prototype.__batch = function(task, callback, reactive, noTransform) {
  var self = this;
  if (reactive == null) {
    reactive = false;
  }
  if (noTransform == null) {
    noTransform = false;
  }
  check(task, Object);
  check(task.to, String);
  check(callback, Match.Optional(Function));
  check(reactive, Boolean);
  if (task.id == null) {
    task.id = Math.floor(Math.random() * (999999999 - 1 + 1) + 1);
  }
  this.emit('query', task);
  if (!callback) {
    return __wait(function(fut) {
      self.once(task.id, function(error, response) {
        bound(function() {
          if (error) {
            fut.throw(error);
          } else {
            fut.return(noTransform ? response : self.__transformData(_.clone(response), reactive));
          }
        });
      });
    });
  } else {
    this.once(task.id, function(error, response) {
      bound(function() {
        callback(error, noTransform ? response : self.__transformData(_.clone(response), reactive));
      });
    });
  }
};

Neo4jDB.prototype.__connect = function() {
  var endpoint, key, _ref2;
  var response = this.__call(this.root);
  var version = '';
  if (response != null ? response.statusCode : void 0) {
    switch (response.statusCode) {
    case 200:
      if (response.data.password_change_required) {
        throw new Error('To connect to Neo4j - password change is required, please proceed to ' + response.data.password_change);
      } else {
        _ref2 = response.data;
        for (key in _ref2) {
          endpoint = _ref2[key];
          if (_.isString(endpoint)) {
            if (!!~endpoint.indexOf('://')) {
              this.__service[key] = new Neo4jEndpoint(key, endpoint, this);
            } else {
              this.__service[key] = {
                get: function() {
                  return endpoint;
                }
              };
            }
            if (key === 'neo4j_version') {
              version = '(v ' + endpoint + ')';
            }
          }
        }
        this.emit('ready');
        return __success('Successfully connected to Neo4j ' + version + ' on ' + this.url);
      }
    default:
      throw new Error(JSON.stringify(response, null, 2));
    }
  } else {
    __error('Error with connection to Neo4j. Please make sure your local Neo4j DB is started, if you use remote Neo4j DB make sure it is available. Ensure credentials for Neo4j DB is right.');
    return __error('Received response from ' + this.url + ': ', response);
  }
};

Neo4jDB.prototype.__call = function(url, options, method, callback) {
  if (options == null) {
    options = {};
  }
  if (method == null) {
    method = 'GET';
  }
  check(url, String);
  check(options, Object);
  check(method, String);
  check(callback, Match.Optional(Function));
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  if (options != null ? options.headers : void 0) {
    options.headers = _.extend(this.defaultHeaders, options.headers);
  } else {
    options.headers = this.defaultHeaders;
  }
  options.json = true;
  options.read_timeout = 10000;
  options.parse_response = 'json';
  options.follow_max = 10;
  var _url = URL.parse(url);
  if (this.https) {
    options.proxy = _url.protocol + '//' + this.username + ':' + this.password + '@' + _url.host;
  }
  if (options.data == null) {
    options.data = {};
  }
  var request = function(method, url, body, options, callback) {
    needle.request(method, url, body, options, function(error, response) {
      var result = null;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = NTRU_def;
      if (!error) {
        result = {
          statusCode: response.statusCode,
          headers:    response.headers,
          content:    response.raw.toString('utf8'),
          data:       response.body
        };
      }
      return callback && callback(error, result);
    });
  };
  try {
    if (!callback) {
      return __wait(function(fut) {
        request(method, url, options.data, options, function(error, response) {
          if (error) {
            fut.throw(error);
          } else {
            fut.return(response);
          }
        });
      });
    } else {
      Fiber(function() {
        request(method, url, options.data, options, callback);
      }).run();
    }
  } catch (e) {
    return __error('Error sending request to Neo4j (GrapheneDB) server: ', e);
  }
};

Neo4jDB.prototype.__parseNode = function(currentNode) {
  var endpoint, key, node, nodeData, paths;
  if ((currentNode != null ? currentNode.metadata : void 0) || (currentNode != null ? currentNode.data : void 0)) {
    node = {
      _service: {}
    };
    for (key in currentNode) {
      endpoint = currentNode[key];
      if (_.isString(endpoint) && !!~endpoint.indexOf('://')) {
        node._service[key] = new Neo4jEndpoint(key, endpoint, this);
      }
    }
    nodeData = _.extend(currentNode.data, currentNode.metadata);
    nodeData.metadata = currentNode.metadata;
    if (currentNode != null ? currentNode['start'] : void 0) {
      paths = currentNode.start.split('/');
      nodeData.start = parseInt(paths[paths.length - 1]);
    }
    if (currentNode != null ? currentNode['end'] : void 0) {
      paths = currentNode.end.split('/');
      nodeData.end = parseInt(paths[paths.length - 1]);
    }
    return _.extend(node, nodeData);
  } else {
    return currentNode;
  }
};

Neo4jDB.prototype.__parseRow = function(result, columns, reactive) {
  var column, index, key, n, node, row, value, _i, _j, _len, _len1, _ref2, _ref3, _ref4, _ref5;
  node = {};
  for (index = _i = 0, _len = columns.length; _i < _len; index = ++_i) {
    column = columns[index];
    if (result != null ? result.graph : void 0) {
      node.relationships = [];
      node.nodes = [];
      _ref2 = result.graph;
      for (key in _ref2) {
        value = _ref2[key];
        if (_.isArray(value) && value.length > 0) {
          for (_j = 0, _len1 = value.length; _j < _len1; _j++) {
            n = value[_j];
            if (key === 'nodes') {
              node.nodes.push(new Neo4jData(this.__parseNode(n), reactive));
            }
            if (key === 'relationships') {
              node.relationships.push(new Neo4jRelationship(this, n, reactive));
            }
          }
        }
      }
    }
    if (result != null ? result.row : void 0) {
      row = {
        node: result.row,
        isRest: false
      };
    }
    if (result != null ? result.rest : void 0) {
      row = {
        node: result.rest,
        isRest: true
      };
    }
    if (!row) {
      row = {
        node: result,
        isRest: true
      };
    }
    if ((_ref3 = row.node) != null ? _ref3[index] : void 0) {
      if (_.isObject(row.node[index])) {
        if (row.isRest) {
          if (((_ref4 = row.node[index]) != null ? _ref4.start : void 0) && ((_ref5 = row.node[index]) != null ? _ref5.end : void 0)) {
            node[column] = new Neo4jRelationship(this, row.node[index], reactive);
          } else {
            node[column] = new Neo4jNode(this, row.node[index], reactive);
          }
        } else {
          node[column] = new Neo4jData(row.node[index], false);
        }
      } else {
        node[column] = new Neo4jData(row.node[index], false);
      }
    }
  }
  return node;
};

Neo4jDB.prototype.__parseResponse = function(data, columns, reactive) {
  var key, res, result;
  res = [];
  for (key in data) {
    result = data[key];
    res.push(this.__parseRow(result, columns, reactive));
  }
  return res;
};

Neo4jDB.prototype.__transformData = function(response, reactive) {
  var hasData, parsed, result, row, _i, _j, _len, _len1, _ref2;
  if ((response != null ? response.results : void 0) || (response != null ? response.errors : void 0)) {
    if (!response.exception) {
      parsed = [];
      _ref2 = response.results;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        result = _ref2[_i];
        if (result != null ? result.data : void 0) {
          parsed = parsed.concat(this.__parseResponse(result.data, result.columns, reactive));
        }
      }
      return parsed;
    } else {
      __error(response.exception);
    }
  }
  if ((response != null ? response.columns : void 0) && (response != null ? response.data : void 0)) {
    if (!_.isEmpty(response.data)) {
      return this.__parseResponse(response.data, response.columns, reactive);
    } else {
      return [];
    }
  }
  if ((response != null ? response.data : void 0) && (response != null ? response.metadata : void 0)) {
    if ((response != null ? response.start : void 0) && (response != null ? response.end : void 0)) {
      return new Neo4jRelationship(this, response, (response != null ? response.self : void 0) ? reactive : false);
    } else if (response != null ? response.self : void 0) {
      return new Neo4jNode(this, response, (response != null ? response.self : void 0) ? reactive : false);
    } else {
      return new Neo4jData(this.__parseNode(response), (response != null ? response.self : void 0) ? reactive : false);
    }
  }
  if (_.isArray(response) && response.length > 0) {
    result = [];
    hasData = false;
    for (_j = 0, _len1 = response.length; _j < _len1; _j++) {
      row = response[_j];
      if (_.isObject(row) && ((row != null ? row.data : void 0) || (row != null ? row.metadata : void 0))) {
        hasData = true;
        if ((row != null ? row.start : void 0) && (row != null ? row.end : void 0)) {
          result.push(new Neo4jRelationship(this, row, (row != null ? row.self : void 0) ? reactive : false));
        } else if (row != null ? row.self : void 0) {
          result.push(new Neo4jNode(this, row, (row != null ? row.self : void 0) ? reactive : false));
        } else {
          result.push(new Neo4jData(this.__parseNode(row), (row != null ? row.self : void 0) ? reactive : false));
        }
      }
    }
    if (hasData) {
      return result;
    }
  }
  return new Neo4jData(response);
};

Neo4jDB.prototype.__getCursor = function(task, callback, reactive) {
  var self = this;
  if (!callback) {
    return __wait(function(fut) {
      self.__batch(task, function(error, data) {
        if (error) {
          return fut.throw(error);
        } else {
          return fut.return(new Neo4jCursor(data));
        }
      }, reactive);
    });
  } else {
    Fiber(function() {
      self.__batch(task, function(error, data) {
        callback(error, new Neo4jCursor(data));
      }, reactive);
    }).run();
    return this;
  }
};

Neo4jDB.prototype.__parseSettings = function(settings, opts, callback) {
  var cb, cypher, parameters, params, query, reactive, reactiveNodes, resultDataContents;
  if (_.isFunction(settings)) {
    callback = settings;
    cypher = void 0;
    opts = {};
    settings = {};
  } else if (_.isArray(settings)) {
    cypher = settings;
    settings = {};
  } else if (_.isObject(settings)) {
    cypher = settings.cypher, query = settings.query, opts = settings.opts, parameters = settings.parameters, params = settings.params, callback = settings.callback, cb = settings.cb, resultDataContents = settings.resultDataContents, reactive = settings.reactive, reactiveNodes = settings.reactiveNodes;
  } else if (_.isString(settings)) {
    cypher = settings;
    settings = {};
  }
  if (_.isFunction(opts)) {
    callback = opts;
    opts = {};
  }
  if (opts == null) {
    opts = {};
  }
  if (cypher == null) {
    cypher = query;
  }
  if (!opts || _.isEmpty(opts)) {
    opts = parameters || params || {};
  }
  if (callback == null) {
    callback = cb;
  }
  if (reactive == null) {
    reactive = reactive || reactiveNodes;
  }
  if (reactive == null) {
    reactive = false;
  }
  if (resultDataContents == null) {
    resultDataContents = ['REST'];
  }
  check(settings, Object);
  check(cypher, Match.Optional(Match.OneOf(String, [String])));
  check(opts, Object);
  check(callback, Match.Optional(Function));
  check(resultDataContents, [String]);
  check(reactive, Boolean);
  return {
    opts: opts,
    cypher: cypher,
    callback: callback,
    resultDataContents: resultDataContents,
    reactive: reactive
  };
};


/*
@locus Server
@summary List all property keys ever used in the database
@name propertyKeys
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-property-values.html
@returns {[String]}
 */
Neo4jDB.prototype.propertyKeys = function() {
  var data = this.__batch({
    method: 'GET',
    to: '/propertykeys'
  }, void 0, false, true);

  if (_.isFunction(data != null ? data.get : void 0)) {
    data = data.get();
  }
  return data;
};


/*
@locus Server
@summary List all labels ever used in the database
@name labels
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-list-all-labels
@returns {[String]}
 */
Neo4jDB.prototype.labels = function() {
  return this.__service.node_labels.get();
};


/*
@locus Server
@summary List all relationship types ever used in the database
@name labels
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-relationship-types.html
@returns {[String]}
 */
Neo4jDB.prototype.relationshipTypes = function() {
  return this.__service.relationship_types.get('GET', {}, true);
};


/*
@locus Server
@summary Return version of Neo4j server we connected to
@name version
@class Neo4jDB
@returns {String}
 */
Neo4jDB.prototype.version = function() {
  return this.__service.neo4j_version.get();
};


/*
@locus Server
@summary Send query via to Transactional endpoint and return results as graph representation
@name graph
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html#rest-api-return-results-in-graph-format
@param {Object | String} settings - Cypher query as String or object of settings
@param {String}   settings.cypher - Cypher query, alias: `settings.query`
@param {Object}   settings.opts - Map of cypher query parameters, aliases: `settings.parameters`, `settings.params`
@param {Boolean}  settings.reactive - Reactive nodes updates on Neo4jCursor.fetch(). Default: `false`. Alias: `settings.reactiveNodes`
@param {Function} settings.callback - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
@param {Object}   opts - Map of cypher query parameters
@param {Function} callback - Callback function. If passed, the method runs asynchronously
@returns {Neo4jCursor} - [{nodes: [], relationships: []}]
 */
Neo4jDB.prototype.graph = function(settings, opts, callback) {
  var cypher, reactive, task, _ref2;
  if (opts == null) {
    opts = {};
  }
  _ref2 = this.__parseSettings(settings, opts, callback), cypher = _ref2.cypher, opts = _ref2.opts, callback = _ref2.callback, reactive = _ref2.reactive;
  task = {
    method: 'POST',
    to: this.__service.transaction.endpoint + '/commit',
    body: {
      statements: [
        {
          statement: cypher,
          parameters: opts,
          resultDataContents: ['graph']
        }
      ]
    }
  };
  return this.__getCursor(task, callback, reactive);
};


/*
@locus Server
@summary Shortcut for `query`, which returns first result from your query as plain Object
@name queryOne
@class Neo4jDB
@param {String} cypher - Cypher query as String
@param {Object} opts   - Map of cypher query parameters
@returns {Object} - Node object as {n:{id,meta,etc..}}, where is `n` is 'NodeLink', for query like `MATCH n RETURN n`
 */

Neo4jDB.prototype.queryOne = function(cypher, opts) {
  return this.query(cypher, opts).fetch(true)[0];
};


/*
@locus Server
@summary Shortcut for `query` (see below for more). Always runs synchronously, but without callback.
@name querySync
@class Neo4jDB
@param {String} cypher - Cypher query as String
@param {Object} opts   - Map of cypher query parameters
@returns {Neo4jCursor}
 */

Neo4jDB.prototype.querySync = function(cypher, opts) {
  check(cypher, String);
  check(opts, Match.Optional(Object));
  return this.query(cypher, opts);
};


/*
@locus Server
@summary Shortcut for `query` (see below for more). Always runs asynchronously, 
         even if no callback is passed. Best option for independent deletions.
@name queryAsync
@class Neo4jDB
@returns {Neo4jCursor | undefined} - Returns Neo4jCursor only in callback
 */

Neo4jDB.prototype.queryAsync = function(cypher, opts, callback) {
  var self = this;
  if (_.isFunction(opts)) {
    callback = opts;
    opts = {};
  }
  if (!callback) {
    callback = function() {};
  }
  Fiber(function() {
    self.query(cypher, opts, callback);
  }).run();
};


/*
@locus Server
@summary Send query to Neo4j via transactional endpoint. This Transaction will be immediately committed. This transaction will be sent inside batch, so if you call multiple async queries, all of them will be sent in one batch in closest (next) event loop.
@name query
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html#rest-api-begin-and-commit-a-transaction-in-one-request
@param {Object | String} settings - Cypher query as String or object of settings
@param {String}   settings.cypher - Cypher query, alias: `settings.query`
@param {Object}   settings.opts - Map of cypher query parameters, aliases: `settings.parameters`, `settings.params`
@param {[String]} settings.resultDataContents - Array of contents to return from Neo4j, like: 'REST', 'row', 'graph'. Default: `['REST']`
@param {Boolean}  settings.reactive - Reactive nodes updates on Neo4jCursor.fetch(). Default: `false`. Alias: `settings.reactiveNodes`
@param {Function} settings.callback - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
@param {Object}   opts - Map of cypher query parameters
@param {Function} callback - Callback function. If passed, the method runs asynchronously.
@returns {Neo4jCursor}
 */

Neo4jDB.prototype.query = function(settings, opts, callback) {
  var cypher, reactive, resultDataContents, task, _ref2;
  if (opts == null) {
    opts = {};
  }
  _ref2 = this.__parseSettings(settings, opts, callback), cypher = _ref2.cypher, opts = _ref2.opts, callback = _ref2.callback, resultDataContents = _ref2.resultDataContents, reactive = _ref2.reactive;
  task = {
    method: 'POST',
    to: this.__service.transaction.endpoint + '/commit',
    body: {
      statements: [
        {
          statement: cypher,
          parameters: opts,
          resultDataContents: resultDataContents
        }
      ]
    }
  };
  return this.__getCursor(task, callback, reactive);
};


/*
@locus Server
@summary Send query to Neo4j via cypher endpoint
@name cypher
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-cypher.html
@param {Object | String} settings - Cypher query as String or object of settings
@param {String}   settings.cypher - Cypher query, alias: `settings.query`
@param {Object}   settings.opts - Map of cypher query parameters, aliases: `settings.parameters`, `settings.params`
@param {[String]} settings.resultDataContents - Array of contents to return from Neo4j, like: 'REST', 'row', 'graph'. Default: `['REST']`
@param {Boolean}  settings.reactive - Reactive nodes updates on Neo4jCursor.fetch(). Default: `false`. Alias: `settings.reactiveNodes`
@param {Function} settings.callback - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
@param {Object}   opts - Map of cypher query parameters
@param {Function} callback - Callback function. If passed, the method runs asynchronously.
@returns {Neo4jCursor}
 */

Neo4jDB.prototype.cypher = function(settings, opts, callback) {
  var cypher, reactive, task, _ref2;
  if (opts == null) {
    opts = {};
  }
  _ref2 = this.__parseSettings(settings, opts, callback), cypher = _ref2.cypher, opts = _ref2.opts, callback = _ref2.callback, reactive = _ref2.reactive;
  task = {
    method: 'POST',
    to: this.__service.cypher.endpoint,
    body: {
      query: cypher,
      params: opts
    }
  };
  return this.__getCursor(task, callback, reactive);
};


/*
@locus Server
@summary Sent tasks to batch endpoint, this method allows to work directly with Neo4j REST API
@name batch
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-batch-ops.html
@param {[Object]} tasks - Array of tasks
@param {String}   tasks.$.method  - HTTP(S) method used sending this task, one of: 'POST', 'GET', 'PUT', 'DELETE', 'HEAD'
@param {String}   tasks.$.to - Endpoint (URL) for task
@param {Number}   tasks.$.id - [Optional] Unique id to identify task. Should be always unique!
@param {mix}      tasks.$.body - [Optional] JSONable object which will be sent as data to task
@param {Object}   settings
@param {Boolean}  settings.reactive - if `true` and if `plain` is true data of node(s) will be updated before returning
@param {Boolean}  settings.plain - if `true`, results will be returned as simple objects instead of Neo4jCursor
@returns {[Object]} - array of Neo4jCursor(s) or array of Object if `plain` is `true`
 */

Neo4jDB.prototype.batch = function(tasks, settings, callback) {
  var ids, plain, reactive, results, task, wait, _i, _len;
  if (settings == null) {
    settings = {};
  }
  if (_.isFunction(settings)) {
    callback = settings;
    settings = {};
  } else {
    reactive = settings.reactive, plain = settings.plain;
  }
  if (reactive == null) {
    reactive = false;
  }
  if (plain == null) {
    plain = false;
  }
  check(tasks, [Object]);
  check(callback, Match.Optional(Function));
  check(reactive, Boolean);
  check(plain, Boolean);
  results = [];
  ids = [];
  for (_i = 0, _len = tasks.length; _i < _len; _i++) {
    task = tasks[_i];
    check(task.method, Match.OneOf('POST', 'GET', 'PUT', 'DELETE', 'HEAD'));
    check(task.to, String);
    check(task.body, Match.Optional(Match.OneOf(Object, String, Number, Boolean, [String], [Number], [Boolean], [Object])));
    if (task.id == null) {
      task.id = Math.floor(Math.random() * (999999999 - 1 + 1) + 1);
    }
    ids.push(task.id);
    this.emit('query', task);
  }
  wait = (function(_this) {
    return function(cb) {
      var id, qty, _j, _len1, _results;
      qty = ids.length;
      _results = [];
      for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
        id = ids[_j];
        _results.push(_this.once(id, function(error, response, id) {
          --qty;
          response = plain ? response : new Neo4jCursor(_this.__transformData(_.clone(response), reactive));
          response._batchId = id;
          results.push(response);
          if (qty === 0) {
            return cb(null, results);
          }
        }));
      }
      return _results;
    };
  })(this);
  if (!callback) {
    return __wait(function(fut) {
      return wait(function(error, results) {
        return fut['return'](results);
      });
    });
  } else {
    Fiber(function() {
      return wait(callback);
    }).run();
    return this;
  }
};


/*
@locus Server
@summary Open Neo4j Transaction. All methods on Neo4jTransaction instance is chainable.
@name transaction
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-transactional.html#rest-api-begin-a-transaction
@param {Function | Object | String | [String]} settings - [Optional] Cypher query as String or Array of Cypher queries or object of settings
@param {String | [String]} settings.cypher - Cypher query(ies), alias: `settings.query`
@param {Object}   settings.opts - Map of cypher query(ies) parameters, aliases: `settings.parameters`, `settings.params`
@param {[String]} settings.resultDataContents - Array of contents to return from Neo4j, like: 'REST', 'row', 'graph'. Default: `['REST']`
@param {Boolean}  settings.reactive - Reactive nodes updates on Neo4jCursor.fetch(). Default: `false`. Alias: `settings.reactiveNodes`
@param {Object} opts - [Optional] Map of cypher query(ies) parameters
@returns {Neo4jTransaction} - Neo4jTransaction instance
 */

Neo4jDB.prototype.transaction = function(settings, opts) {
  if (opts == null) {
    opts = {};
  }
  return new Neo4jTransaction(this, settings, opts);
};


/*
@locus Server
@summary Create or get node object.
         If no arguments is passed, then new node will be created.
         If first argument is number, then node will be fetched from Neo4j
         If first argument is Object, then new node will be created with passed properties
@name nodes
@class Neo4jDB
@url http://neo4j.com/docs/2.2.5/rest-api-nodes.html
@param {Number, Object} id - [Optional], see description above
@param {Boolean} reactive - if passed as `true` - data of node will be updated (only each event loop) before returning
@returns {Neo4jNode} - Neo4jNode instance
 */

Neo4jDB.prototype.nodes = function(id, reactive) {
  return new Neo4jNode(this, id, reactive);
};

Neo4jDB.prototype.relationship = {
  /*
  @locus Server
  @summary Create relationship between two nodes
  @name relationship.create
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-create-a-relationship-with-properties
  @param {Number | Object | Neo4jNode} from - id or instance of node
  @param {Number | Object | Neo4jNode} to - id or instance of node
  @param {String} type - Type (label) of relationship
  @param {Object} properties - Relationship's properties
  @param {Boolean} properties._reactive - Set Neo4jRelationship instance to reactive mode
  @returns {Neo4jRelationship}
   */
  create: function(from, to, type, properties) {
    var reactive, relationship;
    if (properties == null) {
      properties = {};
    }
    if (_.isObject(from)) {
      from = (from != null ? from.id : void 0) || (from != null ? typeof from.get === 'function' ? from.get().id : void 0 : void 0);
    }
    if (_.isObject(to)) {
      to = (to != null ? to.id : void 0) || (to != null ? typeof to.get === 'function' ? to.get().id : void 0 : void 0);
    }
    check(from, Number);
    check(to, Number);
    check(type, String);
    check(properties, Object);
    if (properties != null ? properties._reactive : void 0) {
      reactive = properties._reactive;
      delete properties._reactive;
    }
    if (reactive == null) {
      reactive = false;
    }
    check(reactive, Boolean);
    relationship = this._db.__batch({
      method: 'POST',
      to: this._db.__service.node.endpoint + '/' + from + '/relationships',
      body: {
        to: this._db.__service.node.endpoint + '/' + to,
        type: type,
        data: properties
      }
    }, void 0, false, true);
    return new Neo4jRelationship(this._db, relationship, reactive);
  },

  /*
  @locus Server
  @summary Get relationship object, by id
  @name relationship.get
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-relationship-by-id
  @param {Number} to - id or instance of node
  @param {Boolean} reactive - Set Neo4jRelationship instance to reactive mode
  @returns {Neo4jRelationship}
   */
  get: function(id, reactive) {
    check(id, Number);
    check(reactive, Match.Optional(Boolean));
    return new Neo4jRelationship(this._db, id, reactive);
  }
};

Neo4jDB.prototype.constraint = {

  /*
  @locus Server
  @summary Create constraint for label
  @name constraint.create
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-constraints.html#rest-api-create-uniqueness-constraint
  @param {String} label - Label name
  @param {[String]} keys - Keys
  @param {String} type - Constraint type, default `uniqueness`
  @returns {Object}
   */
  create: function(label, keys, type) {
    if (type == null) {
      type = 'uniqueness';
    }
    check(label, String);
    check(keys, [String]);
    check(type, String);
    return this._db.__batch({
      method: 'POST',
      to: this._db.__service.constraints.endpoint + '/' + label + '/' + type,
      body: {
        property_keys: keys
      }
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Remove (drop) constraint for label
  @name constraint.drop
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-constraints.html#rest-api-drop-constraint
  @param {String} label - Label name
  @param {String} key - Key
  @param {String} type - Constraint type, default `uniqueness`
  @returns {[]} - Empty array
   */
  drop: function(label, key, type) {
    if (type == null) {
      type = 'uniqueness';
    }
    check(label, String);
    check(key, String);
    check(type, String);
    return this._db.__batch({
      method: 'DELETE',
      to: this._db.__service.constraints.endpoint + '/' + label + '/' + type + '/' + key
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Get constraint(s) for label, or get all DB's constraints
  @name constraint.get
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-constraints.html#rest-api-get-a-specific-uniqueness-constraint
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-constraints.html#rest-api-get-all-uniqueness-constraints-for-a-label
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-constraints.html#rest-api-get-all-constraints-for-a-label
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-constraints.html#rest-api-get-all-constraints
  @param {String} label - Label name
  @param {String} key - Key
  @param {String} type - Constraint type, default `uniqueness`
  @returns {[Object]}
   */
  get: function(label, key, type) {
    var params;
    check(label, Match.Optional(String));
    check(key, Match.Optional(String));
    check(type, Match.Optional(String));
    if (!type && key) {
      type = 'uniqueness';
    }
    params = [];
    if (label) {
      params.push(label);
    }
    if (type) {
      params.push(type);
    }
    if (key) {
      params.push(key);
    }
    return this._db.__batch({
      method: 'GET',
      to: this._db.__service.constraints.endpoint + '/' + params.join('/')
    }, void 0, false, true);
  }
};

Neo4jDB.prototype.index = {
  /*
  @locus Server
  @summary Create index for label
  @name index.create
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-indexes.html#rest-api-create-index
  @param {String} label - Label name
  @param {[String]} keys - Index keys
  @returns {Object}
   */
  create: function(label, keys) {
    check(label, String);
    check(keys, [String]);
    return this._db.__batch({
      method: 'POST',
      to: this._db.__service.indexes.endpoint + '/' + label,
      body: {
        property_keys: keys
      }
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Get indexes for label
  @name index.get
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-indexes.html#rest-api-list-indexes-for-a-label
  @param {String} label - Label name
  @returns {[Object]}
   */
  get: function(label) {
    check(label, Match.Optional(String));
    return this._db.__batch({
      method: 'GET',
      to: this._db.__service.indexes.endpoint + '/' + label
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Drop (remove) index for label
  @name index.drop
  @class Neo4jDB
  @url http://neo4j.com/docs/2.2.5/rest-api-schema-indexes.html#rest-api-drop-index
  @param {String} label - Label name
  @param {String} key - Index key
  @returns {[]} - Empty array
   */
  drop: function(label, key) {
    check(label, String);
    check(key, String);
    return this._db.__batch({
      method: 'DELETE',
      to: this._db.__service.indexes.endpoint + '/' + label + '/' + key
    }, void 0, false, true);
  }
};

module.exports = Neo4jDB;
