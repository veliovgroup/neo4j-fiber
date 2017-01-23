var check = require('./check').check;

/*
@locus Server
@summary Represents Neo4j endpoints
         Usually not used directly, it is used internally.
@class Neo4jEndpoint
 */
function Neo4jEndpoint (key, endpoint, _db) {
  this.key = key;
  this.endpoint = endpoint;
  this._db = _db;
  check(this.key, String);
  check(this.endpoint, String);
}

Neo4jEndpoint.prototype.get = function (method, options, directly) {
  if (method == null) {
    method = 'GET';
  }
  if (options == null) {
    options = {};
  }
  if (directly) {
    return this._db.__call(this.endpoint, options, method).data;
  }
  var data = this._db.__batch({
    method: method,
    to: this.endpoint,
    body: (options != null && options.body != null) ? options.body : null
  });
  data = (data != null && data.get && typeof data.get === 'function') ? data.get() : data;
  return data;
};

Neo4jEndpoint.prototype.__getAndProceed = function (funcName) {
  return this._db[funcName](this._db.__batch({
    method: 'GET',
    to: this.endpoint
  }, void 0, false, true));
};

module.exports = Neo4jEndpoint;
