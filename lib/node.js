var _helpers  = require('./helpers');
var _         = _helpers._;
var events    = _helpers.events;
var __wait    = _helpers.__wait;
var __error   = _helpers.__error;
var __extends = _helpers.__extends;

var _check = require('./check');
var check  = _check.check;
var Match  = _check.Match;

var Neo4jData   = require('./data');
var Neo4jCursor = require('./cursor');


/*
@locus Server
@summary Represents Node, Labels, Degree and Properties API(s)
         Most basic way to work with nodes
         Might be reactive data source, if `_isReactive` passed as `true` - data of node will be updated before returning

         If no arguments is passed, then new node will be created.
         If first argument is number, then node will be fetched from Neo4j
         If first argument is Object, then new node will be created with passed properties

         This class is event-driven and all methods is chainable
@class Neo4jNode
 */
function Neo4jNode (_db, _id, _isReactive) {
  var self = this;
  this._db = _db;
  this._id = _id;
  this._isReactive = _isReactive != null ? _isReactive : false;
  events.EventEmitter.call(this);
  this._ready = false;
  this.on('ready', function (node) {
    if (node && !_.isEmpty(node)) {
      self._id = node.metadata.id;
      Neo4jNode.__super__.constructor.call(self, self._db.__parseNode(node), self._isReactive);
      self._ready = true;
    } else {
      self._id = null;
      self._ready = true;
    }
  });

  this.on('create', function (properties) {
    if (!self._ready) {
      try {
        var node = self._db.__batch({
          method: 'POST',
          to: self._db.__service.node.endpoint,
          body: properties
        }, void 0, self._isReactive, true);

        if (node != null ? node.metadata : void 0) {
          self.emit('ready', node);
        } else {
          __error('Node is not created or created wrongly, metadata is not returned!');
          self._ready = true;
        }

      } catch (e) {
        __error(e);
        self._ready = true;
      }
    } else {
      __error('You already in node instance, create new one by calling, `db.nodes().create()`');
      self._ready = true;
    }
  });

  if (_.isObject(this._id)) {
    if (_.has(this._id, 'metadata')) {
      this.emit('ready', this._id);
    } else {
      var properties = this._id;
      this._id = void 0;
      this.emit('create', properties);
    }
  } else if (_.isNumber(this._id)) {
    try {
      var node = this._db.__batch({
        method: 'GET',
        to: this._db.__service.node.endpoint + '/' + this._id
      }, void 0, this._isReactive, true);
      this.emit('ready', node);
    } catch (e) {
      __error(e);
      self._ready = true;
    }
  } else {
    this.emit('create');
  }
  this.index._current = this;
  this.properties     = this.__properties(this);
  this.labels         = this.__labels(this);
}

__extends(Neo4jNode, Neo4jData);
_.extend(Neo4jNode.prototype, events.EventEmitter.prototype);

Neo4jNode.prototype.__return = function (cb) {
  var self = this;
  return __wait(function (fut) {
    if (self._ready) {
      return cb.call(self, fut);
    }
    self.once('ready', function () {
      cb.call(self, fut);
    });
  });
};

Neo4jNode.prototype.__properties = function (self) {
  return {
    /*
    @locus Server
    @summary Get current node's property by name or all properties
    @name properties.get
    @class Neo4jNode
    @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-get-properties-for-node
    @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-get-property-for-node
    @param {String} name - [OPTIONAL] Name of the property
    @returns {Object | String | Boolean | Number | [String] | [Boolean] | [Number]}
     */
    get: function (name) {
      check(name, Match.Optional(String));
      return self.__return(function (fut) {
        self.update();
        if (!name) {
          return fut.return(_.omit(self._node, ['_service', 'labels', 'metadata']));
        }
        fut.return(self._node[name]);
      });
    },

    /*
    @locus Server
    @summary Set (or override, if exists) multiple property on current node
    @name properties.set
    @class Neo4jNode
    @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-set-property-on-node
    @param {String | Object} n  - Name of the property or Object of key:value pairs
    @param {mix} v - [OPTIONAL] Value of the property
    @returns {Neo4jNode}
     */
    set: function (n, v) {
      return self.__return(function (fut) {
        if (_.isObject(n)) {
          check(n, Object);
          var tasks = [];
          for (var name in n) {
            check(n[name], Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean]));
            self._node[name] = n[name];
            tasks.push({
              method: 'PUT',
              to: self._service.property.endpoint.replace('{key}', name),
              body: n[name]
            });
          }
          self._db.batch(tasks, {
            plain: true
          });
        } else {
          check(n, String);
          check(v, Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean]));
          self._node[n] = v;
          self._db.__batch({
            method: 'PUT',
            to: self._service.property.endpoint.replace('{key}', n),
            body: v
          }, void 0, false, true);
        }
        fut.return(self);
      });
    },

    /*
    @locus Server
    @summary Delete all or multiple properties by name from a node.
             If no argument is passed, - all properties will be removed from the node.
    @name properties.delete
    @alias remove
    @class Neo4jNode
    @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-delete-a-named-property-from-a-node
    @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-delete-all-properties-from-node
    @param {[String] | String | null} names - Name or array of property names, pass `null`
                                              or call with no arguments to remove all properties
    @returns {Neo4jNode}
     */
    remove: function () { return this.delete.apply(this, arguments); },
    delete: function (names) {
      check(names, Match.Optional(Match.OneOf(String, [String])));
      return self.__return(function (fut) {
        var i;
        if (_.isString(names)) {
          if (self._node && self._node[names]) {
            delete self._node[names];
            self._db.__batch({
              method: 'DELETE',
              to: self._service.property.endpoint.replace('{key}', names)
            }, function () {}, false, true);
          }
        } else if (_.isArray(names) && names.length > 0) {
          var tasks = [];
          for (i = 0; i < names.length; i++) {
            if (self._node && self._node[names[i]]) {
              delete self._node[names[i]];
              tasks.push({
                method: 'DELETE',
                to: self._service.property.endpoint.replace('{key}', names[i])
              });
            }
          }
          if (tasks.length > 0) {
            self._db.batch(tasks, {
              plain: true
            });
          }
        } else {
          for (var n in _.omit(self._node, ['_service', 'labels', 'metadata'])) {
            delete self._node[n];
          }
          self._db.__batch({
            method: 'DELETE',
            to: self._service.properties.endpoint
          }, function () {}, false, true);
        }
        fut.return(self);
      });
    },

    /*
    @locus Server
    @summary This will replace all existing properties on the node with the new set of attributes.
    @name properties.update
    @class Neo4jNode
    @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-update-node-properties
    @param {Object} nameValue - Object of key:value pairs
    @returns {Neo4jNode}
     */
    update: function (nameValue) {
      check(nameValue, Object);
      return self.__return(function (fut) {
        var n;
        for (n in _.omit(self._node, ['_service', 'labels', 'metadata'])) {
          delete self._node[n];
        }

        for (n in nameValue) {
          self._node[n] = nameValue[n];
        }

        self._db.__batch({
          method: 'PUT',
          to: self._service.properties.endpoint,
          body: nameValue
        }, void 0, false, true);
        fut.return(self);
      });
    }
  };
};


/*
@locus Server
@summary Get current node
@name get
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-get-node
@returns {Object}
 */
Neo4jNode.prototype.get = function () {
  return this.__return(function (fut) {
    fut.return(Neo4jNode.__super__.get.apply(this, arguments));
  });
};


/*
@locus Server
@summary Delete current node
@name delete
@alias remove
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-delete-node
@returns {undefined}
 */
Neo4jNode.prototype.remove = function () { return this.delete.apply(this, arguments); };
Neo4jNode.prototype.delete = function () {
  return this.__return(function (fut) {
    this._db.__batch({
      method: 'DELETE',
      to: this._service.self.endpoint
    }, function () {}, false, true);
    this.node = void 0;
    fut.return(void 0);
  });
};


/*
@locus Server
@summary Set / Get propert(y|ies) on current node, if only first argument is passed - will return property value, if both arguments is presented - property will be updated or created
@name property
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-get-property-for-node
@url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-set-property-on-node
@param {String} name  - Name of the property
@param {String} value - [OPTIONAL] Value of the property
@returns {Neo4jNode | String | Boolean | Number | [String] | [Boolean] | [Number]}
 */
Neo4jNode.prototype.property = function (name, value) {
  check(name, Match.Optional(String));
  if (!value || (!value && !name)) {
    return this.properties.get(name);
  }
  check(value, Match.Optional(Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean])));
  return this.properties.set(name, value);
};

Neo4jNode.prototype.__labels = function (self) {
  return {
    /*
    @locus Server
    @summary Set one or multiple labels for node
    @name labels.set
    @class Neo4jNode
    @url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-adding-multiple-labels-to-a-node
    @url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-adding-a-label-to-a-node
    @param {[String] | String} labels - Array of Label names
    @returns {Neo4jNode}
     */
    set: function (labels) {
      check(labels, Match.OneOf(String, [String]));
      return self.__return(function (fut) {
        if (_.isString(labels)) {
          if (labels.length > 0 && !~self._node.metadata.labels.indexOf(labels)) {
            self._node.metadata.labels.push(labels);
            self._db.__batch({
              method: 'POST',
              to: self._service.labels.endpoint,
              body: labels
            }, void 0, false, true);
          }
        } else {
          labels = _.uniq(labels).filter(function (label) {
            return label.length > 0;
          });
          if (labels.length > 0) {
            for (var i = 0; i < labels.length; i++) {
              self._node.metadata.labels.push(labels[i]);
            }
            self._db.__batch({
              method: 'POST',
              to: self._service.labels.endpoint,
              body: labels
            }, function () {}, false, true);
          }
        }
        fut.return(self);
      });
    },

    /*
    @locus Server
    @summary self removes any labels currently exists on a node, and replaces them with the new labels passed in.
    @name labels.replace
    @class Neo4jNode
    @url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-replacing-labels-on-a-node
    @param {[String]} labels - Array of new Label names
    @returns {Neo4jNode}
     */
    replace: function (labels) {
      check(labels, [String]);
      return self.__return(function (fut) {
        labels = _.uniq(labels).filter(function (label) {
          return label.length > 0;
        });
        if (labels.length > 0) {
          self._node.metadata.labels.splice(0, self._node.metadata.labels.length);
          for (var i = 0; i < labels.length; i++) {
            self._node.metadata.labels.push(labels[i]);
          }
          self._db.__batch({
            method: 'PUT',
            to: self._service.labels.endpoint,
            body: labels
          }, function () {}, false, true);
        }
        fut.return(self);
      });
    },

    /*
    @locus Server
    @summary Remove one or multiple label(s) from Node
    @name labels.delete
    @class Neo4jNode
    @alias remove
    @url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-removing-a-label-from-a-node
    @param {String | [String]} labels - Name or array of Label names to be removed
    @returns {Neo4jNode}
     */
    remove: function () { return this.delete.apply(this, arguments); },
    delete: function (labels) {
      check(labels, Match.OneOf(String, [String]));
      return self.__return(function (fut) {
        if (_.isString(labels)) {
          if (labels.length > 0 && !!~self._node.metadata.labels.indexOf(labels)) {
            self._node.metadata.labels.splice(self._node.metadata.labels.indexOf(labels), 1);
            self._db.__batch({
              method: 'DELETE',
              to: self._service.labels.endpoint + '/' + labels
            }, function () {}, false, true);
          }
        } else {
          labels = _.uniq(labels).filter(function (label) {
            return label.length > 0 && !!~self._node.metadata.labels.indexOf(label);
          });
          if (labels.length > 0) {
            var tasks = [];
            for (var i = 0; i < labels.length; i++) {
              self._node.metadata.labels.splice(self._node.metadata.labels.indexOf(labels[i]), 1);
              tasks.push({
                method: 'DELETE',
                to: self._service.labels.endpoint + '/' + labels[i]
              });
            }

            self._db.batch(tasks, {
              plain: true
            }, function () {});
          }
        }
        fut.return(self);
      });
    }
  };
};


/*
@locus Server
@summary Return list of labels, or set new labels. If `labels` parameter is passed to the function new labels will be added to node.
@name label
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-listing-labels-for-a-node
@url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-adding-multiple-labels-to-a-node
@param {[String]} labels - Array of Label names
@returns {Neo4jNode | [String]}
 */
Neo4jNode.prototype.label = function (labels) {
  check(labels, Match.Optional([String]));
  if (labels) {
    return this.labels.set(labels);
  }
  return this.__return(function (fut) {
    this.update();
    fut.return(this._node.metadata.labels);
  });
};


/*
@locus Server
@summary Return the (all | out | in) number of relationships associated with a node.
@name degree
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-node-degree.html#rest-api-get-the-degree-of-a-node
@param {String} direction - Direction of relationships to count, one of: `all`, `out` or `in`. Default: `all`
@param {[String]} types - Types (labels) of relationship as array
@returns {Number}
 */
Neo4jNode.prototype.degree = function (direction, types) {
  if (direction == null) {
    direction = 'all';
  }
  if (types == null) {
    types = [];
  }
  check(direction, String);
  check(types, Match.Optional([String]));
  return this.__return(function (fut) {
    this._db.__batch({
      method: 'GET',
      to: this._service.self.endpoint + '/degree/' + direction + '/' + types.join('&')
    }, function (error, result) {
      fut.return(result.length === 0 ? 0 : result);
    }, false, true);
  });
};


/*
@locus Server
@summary Create relationship from current node to another
@name to
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-create-a-relationship-with-properties
@param {Number | Object | Neo4jNode} to - id or instance of node
@param {String} type - Type (label) of relationship
@param {Object} properties - Relationship's properties
@param {Boolean} properties._reactive - Set Neo4jRelationship instance to reactive mode
@returns {Neo4jRelationship}
 */
Neo4jNode.prototype.to = function (to, type, properties) {
  if (properties == null) {
    properties = {};
  }
  if (_.isObject(to)) {
    to = to.id || (typeof to.get === 'function') ? to.get().id : void 0;
  }
  check(to, Number);
  check(type, String);
  check(properties, Object);
  return this._db.relationship.create(this._id, to, type, properties);
};


/*
@locus Server
@summary Create relationship to current node from another
@name from
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-create-a-relationship-with-properties
@param {Number | Object | Neo4jNode} from - id or instance of node
@param {String} type - Type (label) of relationship
@param {Object} properties - Relationship's properties
@param {Boolean} properties._reactive - Set Neo4jRelationship instance to reactive mode
@returns {Neo4jRelationship}
 */
Neo4jNode.prototype.from = function (from, type, properties) {
  if (properties == null) {
    properties = {};
  }
  if (_.isObject(from)) {
    from = from.id || (typeof from.get === 'function') ? from.get().id : void 0;
  }
  check(from, Number);
  check(type, String);
  check(properties, Object);
  return this._db.relationship.create(from, this._id, type, properties);
};


/*
@locus Server
@summary Get all node's relationships
@name relationships
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-typed-relationships
@param {String} direction - Direction of relationships to count, one of: `all`, `out` or `in`. Default: `all`
@param {[String]} types - Types (labels) of relationship as array
@returns {Neo4jCursor}
 */
Neo4jNode.prototype.relationships = function (direction, types, reactive) {
  if (direction == null) {
    direction = 'all';
  }
  if (types == null) {
    types = [];
  }
  if (reactive == null) {
    reactive = false;
  }
  check(direction, String);
  check(types, Match.Optional([String]));
  check(reactive, Boolean);
  return this.__return(function (fut) {
    this._db.__batch({
      method: 'GET',
      to: this._service.create_relationship.endpoint + '/' + direction + '/' + types.join('&')
    }, function (error, result) {
      fut.return(new Neo4jCursor(result));
    }, reactive);
  });
};

Neo4jNode.prototype.index = {

  /*
  @locus Server
  @summary Create index on node for label
           This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting
  @name index.create
  @class Neo4jNode
  @param {String} label - Label name
  @param {String} key - Index key
  @param {String} type - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
  @returns {Object}
   */
  create: function (label, key, type) {
    if (type == null) {
      type = 'exact';
    }
    check(label, String);
    check(key, String);
    check(type, Match.OneOf('exact', 'fulltext'));
    return this._current._db.__batch({
      method: 'POST',
      to: this._current._db.__service.node_index.endpoint + '/' + label,
      body: {
        key: key,
        uri: this._current._service.self.endpoint,
        value: type
      }
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Get indexes on node for label
           This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting
  @name index.get
  @class Neo4jNode
  @param {String} label - Label name
  @param {String} key - Index key
  @param {String} type - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
  @returns {Object}
   */
  get: function (label, key, type) {
    if (type == null) {
      type = 'exact';
    }
    check(label, String);
    check(key, String);
    check(type, Match.OneOf('exact', 'fulltext'));
    return this._current._db.__batch({
      method: 'GET',
      to: this._current._db.__service.node_index.endpoint + '/' + label + '/' + key + '/' + type + '/' + this._current._id
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Drop (remove) index on node for label
           This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting
  @name index.drop
  @class Neo4jNode
  @param {String} label - Label name
  @param {String} key - Index key
  @param {String} type - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
  @returns {[]} - Empty array
   */
  drop: function (label, key, type) {
    if (type == null) {
      type = 'exact';
    }
    check(label, String);
    check(key, String);
    check(type, Match.OneOf('exact', 'fulltext'));
    return this._current._db.__batch({
      method: 'DELETE',
      to: this._current._db.__service.node_index.endpoint + '/' + label + '/' + key + '/' + type + '/' + this._current._id
    }, void 0, false, true);
  }
};


/*
@locus Server
@summary Graph Algorithms
@name path
@class Neo4jNode
@url http://neo4j.com/docs/2.2.5/rest-api-graph-algos.html
@param {Number | Neo4jNode} to - Neo4jNode Object or node id as Number
@param {String} type - Relationship type
@param {Object} settings - [OPTIONAL] Object of Graph Algorithm settings
@param {Number} settings.max_depth - The maximum depth as an integer for the algorithms, default is `3`
@param {String} settings.algorithm - One of the algorithms: `shortestPath`, `allSimplePaths`,
                                     `allPaths` or `dijkstra`, default is `shortestPath`
@param {String} settings.cost_property - [for `dijkstra` algorithm only] name of relationship property
@param {Number} settings.default_cost - [REQUIRED for `dijkstra` algorithm if `cost_property` is not defined]
@param {Object} settings.relationships
@param {String} settings.relationships.direction - One of `out` or `in`, default is `out`
@returns {[Object]} - Array of results, like:
n1 = db.nodes()
n2 = db.nodes()
r1 = n1.to(n2, "KNOWS")
console.log(n1.path(n2, "KNOWS"))
 * Output:
 * directions: [ '->' ]
 * start: 20982
 * nodes: [ 20982, 20983 ]
 * length: 1
 * relationships: [ 5375 ]
 * end: 20983
 */
Neo4jNode.prototype.path = function (to, type, settings) {
  if (settings == null) {
    settings = {
      max_depth: 3,
      relationships: {
        direction: 'out'
      },
      algorithm: 'shortestPath'
    };
  }
  if (_.isObject(to)) {
    to = to.id || (typeof to.get === 'function') ? to.get().id : void 0;
  }
  check(to, Number);
  check(type, String);
  settings.to = this._db.__service.node.endpoint + '/' + to;
  if (settings.algorithm == null) {
    settings.algorithm = 'shortestPath';
  }
  if (settings.max_depth == null) {
    settings.max_depth = settings.algorithm === 'allSimplePaths' || settings.algorithm === 'allPaths' ? 3 : void 0;
  }
  if (settings.relationships == null) {
    settings.relationships = {};
  }
  settings.relationships.type = type;
  if (settings.relationships.direction == null) {
    settings.relationships.direction = 'out';
  }
  if (!settings.max_depth) {
    delete settings.max_depth;
  }

  check(settings, {
    to: String,
    max_depth: Match.Optional(Number),
    cost_property: Match.Optional(String),
    relationships: {
      type: String,
      direction: Match.OneOf('in', 'out')
    },
    algorithm: Match.OneOf('shortestPath', 'allSimplePaths', 'allPaths', 'dijkstra')
  });

  var format = function (path) {
    var props = ['start', 'nodes', 'relationships', 'end'];
    var getId = function (url) {
      var p;
      p = url.split('/');
      return parseInt(p[p.length - 1]);
    };

    path._service = {
      start: path.start,
      nodes: path.nodes,
      relationships: path.relationships,
      end: path.end
    };

    var i, v, j;
    for (i = 0; i < props.length; i++) {
      if (_.isArray(path[props[i]])) {
        v = [];
        for (j = 0; j < path[props[i]].length; j++) {
          v.push(getId(path[props[i]][j]));
        }
      } else {
        v = getId(path[props[i]]);
      }
      path[props[i]] = v;
    }
    return path;
  };

  return this.__return(function (fut) {
    this._db.__batch({
      method: 'POST',
      to: this._service.self.endpoint + '/paths',
      body: settings
    }, function (error, results) {
      fut.return(results.map(format));
    }, false, true);
  });
};

module.exports = Neo4jNode;
