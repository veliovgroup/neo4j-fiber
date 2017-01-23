#### *Implementation of Transactional Cypher HTTP endpoint. For more info read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html)*

*This class is event-driven and most of methods is chainable (every which returns `Neo4jTransaction`).*
*Every Transaction have to be finished by calling `.commit()` or `.rollback()` method.*

 - [`commit([cypher, opts, callback])`](#commitsettings-opts-callback)
 - [`execute(cypher, [opts])`](#executesettings-opts)
 - [`rollback()`](#rollback)
 - [`resetTimeout()`](#resettimeout)
 - [`current()`](#current)
 - [`last()`](#last)

---

#### Initiate Transaction via:
 - [`db.transaction([settings, opts])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#transactionsettings-opts)

---

##### `commit([settings, opts, callback])`
*Commit Neo4j Transaction. Read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html#rest-api-commit-an-open-transaction) for more info.*
 - `settings` {*Function* | *Object* | *String* | *[String]*} - Cypher query as String or Array of Cypher queries, object of settings or `callback` function. If `callback` function is passed, the method runs asynchronously.
 - `settings.cypher` {*String* | [String]} - Cypher query(ies), alias: `settings.query`
 - `settings.opts` {*Object*} - Map of cypher query(ies) parameters, aliases: `settings.parameters`, `settings.params`
 - `settings.resultDataContents` {*[String]*} - Array of contents to return from Neo4j, like: 'REST', 'row', 'graph'. Default: `['REST']`
 - `settings.reactive` {*Boolean*} - Reactive nodes will be updated before returning from [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class). Default: `false`. Alias: `settings.reactiveNodes`
 - `settings.callback` {*Function*} - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
 - `opts` {*Object*} - Map of cypher query(ies) parameters
 - `callback` {*Function*} - Callback function. If passed, the method runs asynchronously.
 - Returns {*[Neo4jCursor]*} - Array of [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)(s), or empty array if no nodes was returned during Transaction
```js
db.transaction().commit();
db.transaction().commit( (error, cursors) => { /* Do something with cursors */});
db.transaction().commit("CREATE (n {data})", {data: {uuid: 789}});
db.transaction().commit(["CREATE (n {data1})", "CREATE (n {data2})"], {data1: {uuid: 789}, data2: {uuid: 342}});
db.transaction().commit(["CREATE (n {data})", "MATCH (n) WHERE n.uuid = {data.uuid} RETURN n"], [{data: {uuid: 789}}], (error, cursors) => { cursors[1].fetch(); });
```

---

##### `execute(settings, [opts])`
*Execute statement in open Neo4j Transaction. Read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html#rest-api-execute-statements-in-an-open-transaction) for more info.*
 - `settings` {*Object* | *String* | *[String]*} - Cypher query as String or Array of Cypher queries or object of settings
 - `settings.cypher` {*String* | [String]} - Cypher query(ies), alias: `settings.query`
 - `settings.opts` {*Object*} - Map of cypher query(ies) parameters, aliases: `settings.parameters`, `settings.params`
 - `settings.resultDataContents` {*[String]*} - Array of contents to return from Neo4j, like: 'REST', 'row', 'graph'. Default: `['REST']`
 - `settings.reactive` {*Boolean*} - Reactive nodes will be updated before returning from [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class). Default: `false`. Alias: `settings.reactiveNodes`
 - `opts` {*Object*} - Map of cypher query(ies) parameters
 - Returns {*Neo4jTransaction*}
```js
db.transaction().execute("Query 1").execute("Query 2").execute("Query 3").commit();
db.transaction("Query 1").execute(["Query 2", "Query 3"]).commit("Query 4");
```

---

##### `rollback()`
*Rollback an open transaction. Read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html#rest-api-rollback-an-open-transaction) for more info.*
 - Returns {*undefined*}
```js
db.transaction().rollback();
db.transaction().execute("Query 1").execute("Query 2").execute("Query 3").rollback();
db.transaction("Query 1").execute(["Query 2", "Query 3"]).rollback();
```

---

##### `resetTimeout()`
*Reset transaction timeout of an open Neo4j Transaction. Read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html#rest-api-reset-transaction-timeout-of-an-open-transaction) for more info.*
 - Returns {*Neo4jTransaction*}
```js
const t = db.transaction().execute("Query 1").execute("Query 2").execute("Query 3");
// ..Do something else..
t.resetTimeout();
t.execute(["Query 4", "Query 5"]).commit();
```

---

##### `current()`
*Get current data in Neo4j Transaction.*
 - Returns {*[Neo4jCursor]*} - Array of [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)(s), or empty array if no nodes was returned during Transaction
```js
const t = db.transaction("CREATE (n {data})", {data: {uuid: 789}});
const cursors = t.current();
```

---

##### `last()`
*Get last received data in Neo4j Transaction.*
 - Returns {*Neo4jCursor* | *null*} - [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class), or null if no nodes was returned during Transaction
```js
const t = db.transaction("CREATE (n {data})", {data: {uuid: 789}});
const cursor = t.last();
const data = (cursor && cursor.fetch) ? cursor.fetch() : [];
```