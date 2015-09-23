// Generated by CoffeeScript 1.8.0
(function() {
  var Neo4jData, Neo4jNode, events, _, __wait, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('./helpers'), events = _ref.events, _ = _ref._, __wait = _ref.__wait;

  Neo4jData = require('./data');


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

  module.exports = Neo4jNode = (function(_super) {
    __extends(Neo4jNode, _super);

    _.extend(Neo4jNode.prototype, events.EventEmitter.prototype);

    function Neo4jNode(_db, _id, _isReactive) {
      var error, node, properties;
      this._db = _db;
      this._id = _id;
      this._isReactive = _isReactive != null ? _isReactive : false;
      events.EventEmitter.call(this);
      this._ready = false;
      this.on('ready', (function(_this) {
        return function(node, fut) {
          if (node && !_.isEmpty(node)) {
            _this._id = node.metadata.id;
            Neo4jNode.__super__.constructor.call(_this, _this._db.__parseNode(node), _this._isReactive);
            return _this._ready = true;
          }
        };
      })(this));
      this.on('create', (function(_this) {
        return function(properties) {
          var error, node;
          if (!_this._ready) {
            try {
              node = _this._db.__batch({
                method: 'POST',
                to: _this._db.__service.node.endpoint,
                body: properties
              }, void 0, _this._isReactive, true);
              if (node != null ? node.metadata : void 0) {
                _this.emit('ready', node);
              } else {
                __error("Node is not created or created wrongly, metadata is not returned!");
              }
            } catch (_error) {
              error = _error;
              return __error(error);
            }
          } else {
            return __error("You already in node instance, create new one by calling, `db.nodes().create()`");
          }
        };
      })(this));
      if (_.isObject(this._id)) {
        if (_.has(this._id, 'metadata')) {
          this.emit('ready', this._id);
        } else {
          properties = this._id;
          this._id = void 0;
          this.emit('create', properties);
        }
      } else if (_.isNumber(this._id)) {
        try {
          node = this._db.__batch({
            method: 'GET',
            to: this._db.__service.node.endpoint + '/' + this._id
          }, void 0, this._isReactive, true);
          this.emit('ready', node);
        } catch (_error) {
          error = _error;
          __error(error);
        }
      } else {
        this.emit('create');
      }
      this.index._current = this;
      this.properties = this.__properties();
      this.labels = this.__labels();
    }

    Neo4jNode.prototype.__return = function(cb) {
      return __wait((function(_this) {
        return function(fut) {
          if (_this._ready) {
            return cb.call(_this, fut);
          } else {
            return _this.once('ready', function() {
              return cb.call(_this, fut);
            });
          }
        };
      })(this));
    };

    Neo4jNode.prototype.__properties = function() {
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
        get: (function(_this) {
          return function(name) {
            check(name, Match.Optional(String));
            return _this.__return(function(fut) {
              this.update();
              if (!name) {
                return fut["return"](_.omit(this._node, ['_service', 'id', 'labels', 'metadata']));
              } else {
                return fut["return"](this._node[name]);
              }
            });
          };
        })(this),

        /*
        @locus Server
        @summary Set (or override, if exists) multiple property on current node
        @name properties.set
        @class Neo4jNode
        @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-set-property-on-node
        @param {String | Object} n  - Name of the property or Object of key:value pairs
        @param {String} v - [OPTIONAL] Value of the property
        @returns {Neo4jNode}
         */
        set: (function(_this) {
          return function(n, v) {
            return _this.__return(function(fut) {
              var name, nameValue, tasks, value;
              if (_.isObject(n)) {
                nameValue = n;
                check(nameValue, Object);
                tasks = [];
                for (name in nameValue) {
                  value = nameValue[name];
                  check(value, Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean]));
                  this._node[name] = value;
                  tasks.push({
                    method: 'PUT',
                    to: this._service.property.endpoint.replace('{key}', name),
                    body: value
                  });
                }
                this._db.batch(tasks, {
                  plain: true
                });
              } else {
                check(n, String);
                check(v, Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean]));
                this._node[n] = v;
                this._db.__batch({
                  method: 'PUT',
                  to: this._service.property.endpoint.replace('{key}', n),
                  body: v
                }, void 0, false, true);
              }
              return fut["return"](this);
            });
          };
        })(this),

        /*
        @locus Server
        @summary Delete all or multiple properties by name from a node. 
                 If no argument is passed, - all properties will be removed from the node.
        @name properties.delete
        @class Neo4jNode
        @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-delete-a-named-property-from-a-node
        @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-delete-all-properties-from-node
        @param {[String] | String | null} names - Name or array of property names, pass `null` 
                                                  or call with no arguments to remove all properties
        @returns {Neo4jNode}
         */
        "delete": (function(_this) {
          return function(names) {
            check(names, Match.Optional(Match.OneOf(String, [String])));
            return _this.__return(function(fut) {
              var n, name, tasks, v, _i, _len, _ref1, _ref2, _ref3;
              if (_.isString(names)) {
                if ((_ref1 = this._node) != null ? _ref1[names] : void 0) {
                  delete this._node[names];
                  this._db.__batch({
                    method: 'DELETE',
                    to: this._service.property.endpoint.replace('{key}', names)
                  }, function() {}, false, true);
                }
              } else if (_.isArray(names) && names.length > 0) {
                tasks = [];
                for (_i = 0, _len = names.length; _i < _len; _i++) {
                  name = names[_i];
                  if ((_ref2 = this._node) != null ? _ref2[name] : void 0) {
                    delete this._node[name];
                    tasks.push({
                      method: 'DELETE',
                      to: this._service.property.endpoint.replace('{key}', name)
                    });
                  }
                }
                if (tasks.length > 0) {
                  this._db.batch(tasks, {
                    plain: true
                  });
                }
              } else {
                _ref3 = _.omit(this._node, ['_service', 'id', 'labels', 'metadata']);
                for (n in _ref3) {
                  v = _ref3[n];
                  delete this._node[n];
                }
                this._db.__batch({
                  method: 'DELETE',
                  to: this._service.properties.endpoint
                }, function() {}, false, true);
              }
              return fut["return"](this);
            });
          };
        })(this),

        /*
        @locus Server
        @summary This will replace all existing properties on the node with the new set of attributes.
        @name properties.update
        @class Neo4jNode
        @url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-update-node-properties
        @param {Object} nameValue - Object of key:value pairs
        @returns {Neo4jNode}
         */
        update: (function(_this) {
          return function(nameValue) {
            check(nameValue, Object);
            return _this.__return(function(fut) {
              var n, v, _ref1;
              _ref1 = _.omit(this._node, ['_service', 'id', 'labels', 'metadata']);
              for (n in _ref1) {
                v = _ref1[n];
                delete this._node[n];
              }
              for (n in nameValue) {
                v = nameValue[n];
                this._node[n] = v;
              }
              this._db.__batch({
                method: 'PUT',
                to: this._service.properties.endpoint,
                body: nameValue
              }, void 0, false, true);
              return fut["return"](this);
            });
          };
        })(this)
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

    Neo4jNode.prototype.get = function() {
      return this.__return(function(fut) {
        return fut["return"](Neo4jNode.__super__.get.apply(this, arguments));
      });
    };


    /*
    @locus Server
    @summary Delete current node
    @name delete
    @class Neo4jNode
    @url http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-delete-node
    @returns {undefined}
     */

    Neo4jNode.prototype["delete"] = function() {
      return this.__return(function(fut) {
        this._db.__batch({
          method: 'DELETE',
          to: this._service.self.endpoint
        }, function() {}, false, true);
        this.node = void 0;
        return fut["return"](void 0);
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

    Neo4jNode.prototype.property = function(name, value) {
      check(name, Match.Optional(String));
      if (!value || (!value && !name)) {
        return this.properties.get(name);
      }
      check(value, Match.Optional(Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean])));
      return this.properties.set(name, value);
    };

    Neo4jNode.prototype.__labels = function() {
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
        set: (function(_this) {
          return function(labels) {
            check(labels, Match.OneOf(String, [String]));
            return _this.__return(function(fut) {
              var label, _i, _len;
              if (_.isString(labels)) {
                if (labels.length > 0 && !~this._node.metadata.labels.indexOf(labels)) {
                  this._node.metadata.labels.push(labels);
                  this._db.__batch({
                    method: 'POST',
                    to: this._service.labels.endpoint,
                    body: labels
                  }, void 0, false, true);
                }
              } else {
                labels = _.uniq(labels);
                labels = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = labels.length; _i < _len; _i++) {
                    label = labels[_i];
                    if (label.length > 0) {
                      _results.push(label);
                    }
                  }
                  return _results;
                })();
                if (labels.length > 0) {
                  for (_i = 0, _len = labels.length; _i < _len; _i++) {
                    label = labels[_i];
                    this._node.metadata.labels.push(label);
                  }
                  this._db.__batch({
                    method: 'POST',
                    to: this._service.labels.endpoint,
                    body: labels
                  }, function() {}, false, true);
                }
              }
              return fut["return"](this);
            });
          };
        })(this),

        /*
        @locus Server
        @summary This removes any labels currently exists on a node, and replaces them with the new labels passed in.
        @name labels.replace
        @class Neo4jNode
        @url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-replacing-labels-on-a-node
        @param {[String]} labels - Array of new Label names
        @returns {Neo4jNode}
         */
        replace: (function(_this) {
          return function(labels) {
            check(labels, [String]);
            return _this.__return(function(fut) {
              var label, _i, _len;
              labels = _.uniq(labels);
              labels = (function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = labels.length; _i < _len; _i++) {
                  label = labels[_i];
                  if (label.length > 0) {
                    _results.push(label);
                  }
                }
                return _results;
              })();
              if (labels.length > 0) {
                this._node.metadata.labels.splice(0, this._node.metadata.labels.length);
                for (_i = 0, _len = labels.length; _i < _len; _i++) {
                  label = labels[_i];
                  this._node.metadata.labels.push(label);
                }
                this._db.__batch({
                  method: 'PUT',
                  to: this._service.labels.endpoint,
                  body: labels
                }, function() {}, false, true);
              }
              return fut["return"](this);
            });
          };
        })(this),

        /*
        @locus Server
        @summary Remove one label from node
        @name labels.delete
        @class Neo4jNode
        @url http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-removing-a-label-from-a-node
        @param {String } labels - Name of Label to be removed
        @returns {Neo4jNode}
         */
        "delete": (function(_this) {
          return function(labels) {
            check(labels, Match.OneOf(String, [String]));
            return _this.__return(function(fut) {
              var label, tasks, _i, _len;
              if (_.isString(labels)) {
                if (labels.length > 0 && !!~this._node.metadata.labels.indexOf(labels)) {
                  this._node.metadata.labels.splice(this._node.metadata.labels.indexOf(labels), 1);
                  this._db.__batch({
                    method: 'DELETE',
                    to: this._service.labels.endpoint + '/' + labels
                  }, function() {}, false, true);
                }
              } else {
                labels = _.uniq(labels);
                labels = (function() {
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = labels.length; _i < _len; _i++) {
                    label = labels[_i];
                    if (label.length > 0 && !!~this._node.metadata.labels.indexOf(label)) {
                      _results.push(label);
                    }
                  }
                  return _results;
                }).call(this);
                if (labels.length > 0) {
                  tasks = [];
                  for (_i = 0, _len = labels.length; _i < _len; _i++) {
                    label = labels[_i];
                    this._node.metadata.labels.splice(this._node.metadata.labels.indexOf(label), 1);
                    tasks.push({
                      method: 'DELETE',
                      to: this._service.labels.endpoint + '/' + label
                    });
                  }
                  this._db.batch(tasks, {
                    plain: true
                  }, function() {});
                }
              }
              return fut["return"](this);
            });
          };
        })(this)
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

    Neo4jNode.prototype.label = function(labels) {
      check(labels, Match.Optional([String]));
      if (labels) {
        return this.labels.set(labels);
      }
      return this.__return(function(fut) {
        this.update();
        return fut["return"](this._node.metadata.labels);
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

    Neo4jNode.prototype.degree = function(direction, types) {
      if (direction == null) {
        direction = 'all';
      }
      if (types == null) {
        types = [];
      }
      check(direction, String);
      check(types, Match.Optional([String]));
      return this.__return(function(fut) {
        return this._db.__batch({
          method: 'GET',
          to: this._service.self.endpoint + '/degree/' + direction + '/' + types.join('&')
        }, (function(_this) {
          return function(error, result) {
            return fut["return"](result.length === 0 ? 0 : result);
          };
        })(this), false, true);
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

    Neo4jNode.prototype.to = function(to, type, properties) {
      if (properties == null) {
        properties = {};
      }
      if (_.isObject(to)) {
        to = (to != null ? to.id : void 0) || (to != null ? typeof to.get === "function" ? to.get().id : void 0 : void 0);
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

    Neo4jNode.prototype.from = function(from, type, properties) {
      if (properties == null) {
        properties = {};
      }
      if (_.isObject(from)) {
        from = (from != null ? from.id : void 0) || (from != null ? typeof from.get === "function" ? from.get().id : void 0 : void 0);
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

    Neo4jNode.prototype.relationships = function(direction, types, reactive) {
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
      return this.__return(function(fut) {
        return this._db.__batch({
          method: 'GET',
          to: this._service.create_relationship.endpoint + '/' + direction + '/' + types.join('&')
        }, (function(_this) {
          return function(error, result) {
            return fut["return"](new Neo4jCursor(result));
          };
        })(this), reactive);
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
      @param {[String]} key - Index key
      @param {String} type - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
      @returns {Object}
       */
      create: function(label, key, type) {
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
      @param {[String]} key - Index key
      @param {String} type - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
      @returns {[Object]}
       */
      get: function(label, key, type) {
        if (type == null) {
          type = 'exact';
        }
        check(label, String);
        check(key, String);
        check(type, Match.OneOf('exact', 'fulltext'));
        return this._current._db.__batch({
          method: 'GET',
          to: "" + this._current._db.__service.node_index.endpoint + "/" + label + "/" + key + "/" + type + "/" + this._current._id
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
      drop: function(label, key, type) {
        if (type == null) {
          type = 'exact';
        }
        check(label, String);
        check(key, String);
        check(type, Match.OneOf('exact', 'fulltext'));
        return this._current._db.__batch({
          method: 'DELETE',
          to: "" + this._current._db.__service.node_index.endpoint + "/" + label + "/" + key + "/" + type + "/" + this._current._id
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

    Neo4jNode.prototype.path = function(to, type, settings) {
      var format, _base, _ref1;
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
        to = (to != null ? to.id : void 0) || (to != null ? typeof to.get === "function" ? to.get().id : void 0 : void 0);
      }
      check(to, Number);
      check(type, String);
      settings.to = this._db.__service.node.endpoint + '/' + to;
      if (settings.algorithm == null) {
        settings.algorithm = 'shortestPath';
      }
      if (settings.max_depth == null) {
        settings.max_depth = (_ref1 = settings.algorithm) === 'allSimplePaths' || _ref1 === 'allPaths' ? 3 : void 0;
      }
      if (settings.relationships == null) {
        settings.relationships = {};
      }
      settings.relationships.type = type;
      if ((_base = settings.relationships).direction == null) {
        _base.direction = 'out';
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
      format = function(path) {
        var getId, prop, props, v, val, _i, _j, _len, _len1, _ref2;
        props = ['start', 'nodes', 'relationships', 'end'];
        getId = function(url) {
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
        for (_i = 0, _len = props.length; _i < _len; _i++) {
          prop = props[_i];
          if (_.isArray(path[prop])) {
            v = [];
            _ref2 = path[prop];
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
              val = _ref2[_j];
              v.push(getId(val));
            }
          } else {
            v = getId(path[prop]);
          }
          path[prop] = v;
        }
        return path;
      };
      return this.__return(function(fut) {
        return this._db.__batch({
          method: 'POST',
          to: this._service.self.endpoint + '/paths',
          body: settings
        }, (function(_this) {
          return function(error, results) {
            var result;
            return fut["return"]((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = results.length; _i < _len; _i++) {
                result = results[_i];
                _results.push(format(result));
              }
              return _results;
            })());
          };
        })(this), false, true);
      });
    };

    return Neo4jNode;

  })(Neo4jData);

}).call(this);