#### *Implementation of cursor for Neo4j results*

 - [`fetch()`](#fetch)
 - [`first()`](#first)
 - [`current()`](#current)
 - [`next()`](#next)
 - [`previous()`](#previous)
 - [`each(callback)`](#eachcallback)
 - [`forEach(callback)`](#foreachcallback)

---

##### `fetch()`
*Returns array of fetched rows. If query was passed with `reactive` option - data will be updated each event loop.*
 - Returns: {*[Object]*}
```coffee
db.query("MATCH n RETURN n").fetch()
```
---

##### `first()`
*Move cursor to first item and return it.*
 - Returns: {*[Object]*} - Array of data instances or `undefined` if cursor has no items
```coffee
db.query("MATCH n RETURN n").first()
```
---

##### `current()`
*Get current data instance(s) on cursor.*
 - Returns: {*[Object]*} - Array of data instances or `undefined` if cursor has no items
```coffee
db.query("MATCH n RETURN n").current()
```
---

##### `next()`
*Go to next item on cursor and return it.*
 - Returns: {*[Object]*} - Array of data instances or `undefined` if cursor has no items
```coffee
db.query("MATCH n RETURN n").next()
```
---

##### `previous()`
*Go to previous item on cursor and return it.*
 - Returns: {*[Object]*} - Array of data instances or `undefined` if cursor has no items
```coffee
db.query("MATCH n RETURN n").previous()
```
---

##### `each(callback)`
*Iterates thought Neo4j query results. And returns data as data instance(s). This function will move cursor to latest item.*
 - `callback` {*Function*} - Callback function, with `data` (as `Neo4jData`, [`Neo4jRelationship`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class) or [`Neo4jNode`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class) instance(s)), `num`, `cursor` arguments
 - Returns: {*undefined*}
```coffee
db.query("MATCH n RETURN n").each (data, i, cursor) ->
  data.n.property updatedAt: +new Date
  data.n.get()
  data.n.delete()
```
---

##### `forEach(callback)`
*Iterates though Neo4j query results. If query was passed with `reactive` option - data will be updated each event loop.*
 - `callback` {*Function*} - Callback function, with `data` (plain object), `num`, `cursor` arguments
 - Returns: {*undefined*}
```coffee
db.query("MATCH n RETURN n").forEach (data, i, cursor) ->
  data.n
```