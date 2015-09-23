// Generated by CoffeeScript 1.8.0
(function() {
  var Match, Neo4jEndpoint, check, _ref;

  _ref = require('./check'), check = _ref.check, Match = _ref.Match;


  /*
  @locus Server
  @summary Represents Neo4j endpoints
           Usually not used directly, it is used internally.
  @class Neo4jEndpoint
   */

  module.exports = Neo4jEndpoint = (function() {
    function Neo4jEndpoint(key, endpoint, _db) {
      this.key = key;
      this.endpoint = endpoint;
      this._db = _db;
      check(this.key, String);
      check(this.endpoint, String);
    }

    Neo4jEndpoint.prototype.get = function(method, options, directly) {
      var data;
      if (method == null) {
        method = 'GET';
      }
      if (options == null) {
        options = {};
      }
      if (directly) {
        return this._db.__call(this.endpoint, options, method).data;
      } else {
        data = this._db.__batch({
          method: method,
          to: this.endpoint,
          body: options.body
        });
        if (_.isFunction(data.get)) {
          return data = data.get();
        }
      }
    };

    Neo4jEndpoint.prototype.__getAndProceed = function(funcName) {
      return this._db[funcName](this._db.__batch({
        method: 'GET',
        to: this.endpoint
      }, void 0, false, true));
    };

    return Neo4jEndpoint;

  })();

}).call(this);