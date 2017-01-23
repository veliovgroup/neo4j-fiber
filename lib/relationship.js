var __hasProp = {}.hasOwnProperty;
var __extends = function (child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) {child[key] = parent[key];} } function ctor () { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

var _helpers = require('./helpers');
var _        = _helpers._;
var events   = _helpers.events;
var __wait   = _helpers.__wait;
var __error  = _helpers.__error;

var _check = require('./check');
var check  = _check.check;
var Match  = _check.Match;

var Neo4jData   = require('./data');


/*
@locus Server
@url http://neo4j.com/docs/2.2.5/rest-api-relationships.html
@summary Represents Relationship API(s)
         Most basic way to work with relationships
         Might be reactive data source, if `_isReactive` passed as `true` - data of relationship will be updated before returning

         First argument must be number (id) or object returned from db
         This class is event-driven and all methods is chainable
@class Neo4jRelationship
 */
function Neo4jRelationship (_db, _id, _isReactive) {
  var self = this;
  this._db = _db;
  this._id = _id;
  this._isReactive = _isReactive != null ? _isReactive : false;
  events.EventEmitter.call(this);
  this._ready = false;
  this.on('ready', function (relationship) {
    if (relationship && !_.isEmpty(relationship)) {
      self._id = relationship.id || relationship.metadata.id;
      Neo4jRelationship.__super__.constructor.call(self, self._db.__parseNode(relationship), self._isReactive);
      self._ready = true;
    }
  });

  if (_.isObject(this._id)) {
    if ((this._id && this._id.startNode) || (this._id && this._id.start)) {
      this.emit('ready', this._id);
    } else {
      __error('Relationship is not created or created wrongly, `startNode` or `start` is not returned!');
    }
  } else if (_.isNumber(this._id)) {
    this._db.__batch({
      method: 'GET',
      to: '/relationship/' + this._id
    }, function (error, relationship) {
      self.emit('ready', relationship);
    }, this._isReactive, true);
  }
  this.index._current = this;
  this.properties     = this.__properties(this);
}
__extends(Neo4jRelationship, Neo4jData);
_.extend(Neo4jRelationship.prototype, events.EventEmitter.prototype);

Neo4jRelationship.prototype.__return = function (cb) {
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


/*
@locus Server
@summary Get relationship data
@name get
@class Neo4jRelationship
@url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-relationship-by-id
@returns {Object}
 */
Neo4jRelationship.prototype.get = function () {
  return this.__return(function (fut) {
    fut.return(Neo4jRelationship.__super__.get.apply(this, arguments));
  });
};


/*
@locus Server
@summary Delete relationship
@name delete
@alias remove
@class Neo4jRelationship
@url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-delete-relationship
@returns {undefined}
 */
Neo4jRelationship.prototype.remove = function () { return this.delete.apply(this, arguments); };
Neo4jRelationship.prototype.delete = function () {
  return this.__return(function (fut) {
    this._db.__batch({
      method: 'DELETE',
      to: this._service.self.endpoint
    }, function () {}, false, true);
    this.node = void 0;
    fut.return(void 0);
  });
};

Neo4jRelationship.prototype.__properties = function (self) {
  return {
    /*
    @locus Server
    @summary Get current relationship's one property or all properties
    @name properties.get
    @class Neo4jRelationship
    @url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-single-property-on-a-relationship
    @url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-all-properties-on-a-relationship
    @param {String} name - [OPTIONAL] Name of the property
    @returns {Object | String | Boolean | Number | [String] | [Boolean] | [Number]}
     */
    get: function (name) {
      return self.__return(function (fut) {
        self.update();
        if (name) {
          self.update();
          return fut.return(self.node[name]);
        }
        fut.return(_.omit(self.node, ['_service', 'id', 'type', 'metadata', 'start', 'end']));
      });
    },

    /*
    @locus Server
    @summary Set (or override, if exists) one property on current relationship
    @name properties.set
    @class Neo4jRelationship
    @url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-set-single-property-on-a-relationship
    @param {String | Object} n  - Name or object of key:value pairs
    @param {mix} v - [OPTIONAL] Value of the property
    @returns {Neo4jRelationship}
     */
    set: function (n, v) {
      return self.__return(function (fut) {
        var name, nameValue, tasks, value;
        if (_.isObject(n)) {
          nameValue = n;
          check(nameValue, Object);
          tasks = [];
          for (name in nameValue) {
            value = nameValue[name];
            check(value, Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean]));
            self._node[name] = value;
            tasks.push({
              method: 'PUT',
              to: self._service.property.endpoint.replace('{key}', name),
              body: value
            });
          }
          self._db.batch(tasks, {
            plain: true
          }, function () {});
        } else {
          check(n, String);
          check(v, Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean]));
          self._node[n] = v;
          self._db.__batch({
            method: 'PUT',
            to: self._service.property.endpoint.replace('{key}', n),
            body: v
          }, function () {}, false, true);
        }
        fut.return(self);
      });
    },

    /*
    @locus Server
    @summary Delete one or all propert(y|ies) by name from a relationship
             If no argument is passed, - all properties will be removed from the relationship.
    @name properties.delete
    @alias remove
    @class Neo4jRelationship
    @url http://neo4j.com/docs/2.2.5/rest-api-relationship-properties.html#rest-api-remove-property-from-a-relationship
    @url http://neo4j.com/docs/2.2.5/rest-api-relationship-properties.html#rest-api-remove-properties-from-a-relationship
    @param {String | [String]} names - Name or array of names of the property
    @returns {Neo4jRelationship}
     */
    remove: function () { return this.delete.apply(this, arguments); },
    delete: function (names) {
      check(names, Match.Optional(Match.OneOf(String, [String])));
      return self.__return(function (fut) {
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
          for (var i = 0; i < names.length; i++) {
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
          for (var k in _.omit(self._node, ['_service', 'id', 'type', 'metadata', 'start', 'end'])) {
            delete self._node[k];
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
    @summary self ~~will replace all existing properties~~ (not actually due to [self bug](https://github.com/neo4j/neo4j/issues/5341)), it will update existing properties and add new.
    @name properties.update
    @class Neo4jRelationship
    @url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-set-all-properties-on-a-relationship
    @param {Object} nameValue - Object of key:value pairs
    @returns {Neo4jRelationship}
     */
    update: function (nameValue) {
      check(nameValue, Object);
      return self.__return(function (fut) {
        var k, v;
        for (k in nameValue) {
          v = nameValue[k];
          self._node[k] = v;
        }
        self._db.__batch({
          method: 'PUT',
          to: self._service.properties.endpoint,
          body: nameValue
        }, function () {}, false, true);
        fut.return(self);
      });
    }
  };
};


/*
@locus Server
@summary Set / Get property on current relationship, if only first argument is passed - will return property value, if both arguments is presented - property will be updated or created
@name setProperty
@class Neo4jRelationship
@url http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-single-property-on-a-relationship
@url http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-set-property-on-node
@param {String} name  - Name of the property
@param {String} value - [OPTIONAL] Value of the property
@returns {Neo4jRelationship | String | Boolean | Number | [String] | [Boolean] | [Number]}
 */
Neo4jRelationship.prototype.property = function (name, value) {
  check(name, String);
  if (!value) {
    return this.properties.get(name);
  }
  check(value, Match.Optional(Match.OneOf(String, Number, Boolean, [String], [Number], [Boolean])));
  return this.properties.set(name, value);
};

Neo4jRelationship.prototype.index = {

  /*
  @locus Server
  @summary Create index on relationship for type (label)
           This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting
  @name index.create
  @class Neo4jRelationship
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
      to: this._current._db.__service.relationship_index.endpoint + '/' + label,
      body: {
        key: key,
        uri: this._current._service.self.endpoint,
        value: type
      }
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Get indexes on relationship for type (label)
           This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting
  @name index.get
  @class Neo4jRelationship
  @param {String} label - Label name
  @param {[String]} key - Index key
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
      to: this._current._db.__service.relationship_index.endpoint + '/' + label + '/' + key + '/' + type + '/' + this._current._id
    }, void 0, false, true);
  },

  /*
  @locus Server
  @summary Drop (remove) index on relationship for type (label)
           This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting
  @name index.drop
  @class Neo4jRelationship
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
      to: this._current._db.__service.relationship_index.endpoint + '/' + label + '/' + key + '/' + type + '/' + this._current._id
    }, void 0, false, true);
  }
};

module.exports = Neo4jRelationship;
