var _     = require('./helpers')._;
var check = require('./check').check;


/*
@locus Server
@summary Implementation of cursor for Neo4j results
@class Neo4jCursor
 */
function Neo4jCursor(_cursor) {
  this._cursor     = _cursor;
  this.length      = this._cursor.length;
  this._current    = 0;
  this.hasNext     = (this._cursor.length > 1);
  this.hasPrevious = false;
}

Neo4jCursor.define('cursor', {
  get: function() {
    return this._cursor;
  },
  set: function() {
    console.warn('This is not going to work, you trying to reset cursor, make new Cypher query instead');
  }
});


/*
@locus Server
@summary Returns array of fetched rows. If query was passed with `reactive` option - data will be updated each event loop.
@name fetch
@class Neo4jCursor
@returns {[Object]} - Returns array of fetched rows
 */
Neo4jCursor.prototype.fetch = function(firstOnly) {
  var data = [];
  this.forEach(function(row) {
    data.push(row);
  }, firstOnly);
  return data;
};


/*
@locus Server
@summary Move cursor to first item and return it
@name first
@class Neo4jCursor
@returns {[Object]} - Array of data instances or `undefined` if cursor has no items
 */
Neo4jCursor.prototype.first = function() {
  this._current    = 0;
  this.hasNext     = (this._cursor.length > 1);
  this.hasPrevious = false;
  return this._cursor[0];
};


/*
@locus Server
@summary Get current data instance(s) on cursor
@name current
@class Neo4jCursor
@returns {[Object]} - Array of data instances or `undefined` if cursor has no items
 */
Neo4jCursor.prototype.current = function() {
  return this._cursor[this._current];
};


/*
@locus Server
@summary Go to next item on cursor and return it
@name next
@class Neo4jCursor
@returns {[Object]} - Array of data instances, or `undefined` if no next item
 */
Neo4jCursor.prototype.next = function() {
  if (this.hasNext) {
    if (this._current <= this.length - 1) {
      ++this._current;
      this.hasNext     = (this._current !== this.length - 1);
      this.hasPrevious = true;
      return this._cursor[this._current];
    }
  }
};


/*
@locus Server
@summary Go to previous item on cursor and return it
@name previous
@class Neo4jCursor
@returns {[Object]} - Array of data instances, or `undefined` if no previous item
 */
Neo4jCursor.prototype.previous = function() {
  if (this.hasPrevious) {
    if (this._current >= 1) {
      --this._current;
      this.hasNext     = true;
      this.hasPrevious = (this._current !== 0);
      return this._cursor[this._current];
    }
  }
};


/*
@locus Server
@summary [EXPEMENETAL] Puts all unique objects from current cursor into Mongo collection
@name toMongo
@class Neo4jCursor
@param {Collection} MongoCollection - Instance of Mongo collection created via `new Mongo.Collection()`
@returns {Collection}
 */
Neo4jCursor.prototype.toMongo = function(MongoCollection) {
  MongoCollection._ensureIndex({
    id: 1
  }, {
    background: true,
    sparse: true,
    unique: true
  });
  var nodes = {};

  this.forEach(function(row) {
    var node, nodeAlias;
    for (nodeAlias in row) {
      node = row[nodeAlias];
      if (node != null ? node.id : void 0) {
        if (nodes[node.id] == null) {
          nodes[node.id] = {
            columns: [nodeAlias]
          };
        }
        nodes[node.id].columns = _.union(nodes[node.id].columns, [nodeAlias]);
        nodes[node.id] = _.extend(nodes[node.id], node);
        if (nodes[node.id]._service) {
          nodes[node.id]._service = void 0;
          delete nodes[node.id]._service;
        }
        MongoCollection.upsert({
          id: node.id
        }, {
          $set: nodes[node.id]
        });
      }
    }
  });
  return MongoCollection;
};


/*
@locus Server
@summary Iterates thought Neo4j query results. And returns data as `Neo4jData`, `Neo4jRelationship` or `Neo4jNode` instance (depends from Cypher query). This function will move cursor to latest item.
@name each
@class Neo4jCursor
@param {Function} callback - Callback function, with `node` (as `Neo4jData`, `Neo4jRelationship` or `Neo4jNode` instance(s)), `num`, `cursor` arguments
@returns {undefined}
 */
Neo4jCursor.prototype.each = function(callback) {
  check(callback, Function);
  if (this.length > 0) {
    var first = true;
    while (this.hasNext || first) {
      if (first) {
        callback(this.first(), this._current, this._cursor);
        first = false;
      } else {
        callback(this.next(), this._current, this._cursor);
      }
    }
  }
};


/*
@locus Server
@summary Iterates though Neo4j query results. If query was passed with `reactive` option - data will be updated each event loop.
@name forEach
@class Neo4jCursor
@param {Function} callback - Callback function, with `data` (plain object), `num`, `cursor` arguments
@returns {undefined}
 */
Neo4jCursor.prototype.forEach = function(callback, firstOnly) {
  var node, nodeAlias, i, rowId = -1;
  check(callback, Function);
  while (++rowId < this.cursor.length) {
    var data = {};
    if (_.isFunction(this.cursor[rowId].get)) {
      data = this.cursor[rowId].get();
    } else if (_.isObject(this.cursor[rowId])) {
      for (nodeAlias in this.cursor[rowId]) {
        node = this.cursor[rowId][nodeAlias];
        if (nodeAlias === 'nodes') {
          node = _.clone(node);
          for (i = 0; i < node.length; i++) {
            if (node[i] != null && typeof node[i].get === 'function') {
              node[i] = node[i].get();
            }
          }
        }

        if (nodeAlias === 'relationships') {
          node = _.clone(node);
          for (i = 0; i < node.length; i++) {
            if (node[i] != null && typeof node[i].get === 'function') {
              node[i] = node[i].get();
            }
          }
        }

        if (node != null && typeof node.get === 'function') {
          data[nodeAlias] = node.get();
        } else {
          data[nodeAlias] = node;
        }
      }
    }

    callback(data, rowId, this._cursor);
    if (firstOnly) {
      break;
    }
  }
};

module.exports = Neo4jCursor;
