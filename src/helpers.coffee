colorize = (args, color) ->
  messages = ['\x1b[1m', "\x1b[#{color}m"]
  for arg in args
    messages.push if _.isObject arg then arg.toString() else arg
  messages.push '\x1b[39m', '\x1b[22m\x1b[0m'
  return messages
__success = -> process.stdout.write colorize(arguments, '32').join('') + '\r\n'
__error   = -> process.stdout.write colorize(arguments, '31').join('') + '\r\n'

Function::define = (name, getSet) -> Object.defineProperty @prototype, name, getSet

Fiber  = require 'fibers'
Future = require 'fibers/future'
_      = require 'underscore'

module.exports = 
  _:         _
  NTRU_def:  process.env.NODE_TLS_REJECT_UNAUTHORIZED
  bound:     (cb) -> Fiber( -> cb()).run()
  __success: __success
  __error:   __error
  events:    require 'events'
  URL:       require 'url'
  needle:    require 'needle'
  Future:    Future
  Fiber:     Fiber
  __wait:    (cb) -> 
    fut = new Future()
    cb(fut)
    return fut.wait()