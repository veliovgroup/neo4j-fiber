var _        = require('underscore');
var colorize = function (args, color) {
  var messages = ['\x1b[1m', '\x1b[' + color + 'm'];

  for (var i = 0; i < args.length; i++) {
    try {
      messages.push(_.isObject(args[i]) ? args[i].toString() : args[i]);
    } catch (e) {
      messages.push(JSON.stringify(args[i], null, 2));
    }
  }
  messages.push('\x1b[39m', '\x1b[22m\x1b[0m');
  return messages;
};

Function.prototype.define = function (name, getSet) {
  return Object.defineProperty(this.prototype, name, getSet);
};

var Fiber  = require('fibers');
var Future = require('fibers/future');
var events  = require('events');
events.EventEmitter.prototype._maxListeners = 100;

module.exports = {
  _: _,
  NTRUDef: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
  bound: function (cb) {
    Fiber(function () {
      cb();
    }).run();
  },
  __success: function () {
    process.stdout.write(colorize(arguments, '32').join('') + '\r\n');
  },
  __error: function () {
    process.stdout.write(colorize(arguments, '31').join('') + '\r\n');
  },
  events: events,
  URL: require('url'),
  needle: require('needle'),
  Future: Future,
  Fiber: Fiber,
  __wait: function (cb) {
    var fut = new Future();
    cb(fut);
    return fut.wait();
  }
};
