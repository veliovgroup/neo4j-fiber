var _ = require('./helpers')._;

/*
@locus Server
@summary Represents Data state, relations, and data
         Represents as Nodes and Relationships, as well
         Might be reactive data source, if `_isReactive` passed as `true` - data of node will be updated before returning
         Usually not used directly, it is returned inside of Neo4jCursor instance until `fetch()` or `forEach` methods is called, then it's returned as plain object.
@class Neo4jData
 */
function Neo4jData(n, _isReactive, _expiration) {
  this._isReactive = _isReactive != null ? _isReactive : false;
  this._expiration = _expiration != null ? _expiration : 0;
  this.node = n;
  this.__refresh();
}

Neo4jData.prototype.__refresh = function() {
  this._expire = (+new Date()) + (this._expiration * 1000);
};

Neo4jData.define('node', {
  get: function() {
    if (this._isReactive && this._expire < +new Date()) {
      return this.update()._node;
    } else {
      return this._node;
    }
  },
  set: function(value) {
    var v1, v2;
    if (this._node && this._node._service) {
      v1 = _.clone(this._node);
      delete v1._service;
    } else if (_.isObject(this._node)) {
      v1 = _.clone(this._node);
    } else {
      v1 = this._node;
    }

    if (value && value._service) {
      v2 = _.clone(value);
      delete v2._service;
    } else if (_.isObject(value)) {
      v2 = _.clone(value);
    } else {
      v2 = value;
    }

    if (JSON.stringify(v1) !== JSON.stringify(v2)) {
      if (value && value._service) {
        this._service = _.clone(value._service);
        delete value._service;
      }
      return this._node = value;
    }
  }
});


/*
@locus Server
@summary Get Neo4j data, if data was requested with REST data
         and it's reactive, will return updated data
@name get
@class Neo4jData
@url http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-get-node
@returns {Object | [Object] | [String]} - Depends from cypher query
 */
Neo4jData.prototype.get = function() {
  return this.node;
};


/*
@locus Server
@summary Update Neo4j data, only if data was requested as REST and instance is reactive
@name update
@class Neo4jData
@url http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-get-node
@param {Boolean} force - Force node's data update
@returns {Object | [Object] | [String]} - Depends from cypher query
 */
Neo4jData.prototype.update = function(force) {
  if (force == null) {
    force = false;
  }
  if (this._node && this._service && (this._isReactive || force)) {
    this.__refresh();
    this.node = this._service.self.__getAndProceed('__parseNode');
  }
  return this;
};

module.exports = Neo4jData;
