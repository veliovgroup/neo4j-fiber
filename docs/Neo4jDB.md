#### *Connector to Neo4j, with basic Neo4j REST API methods implementation*

 - [`propertyKeys()`](#propertykeys)
 - [`labels()`](#labels)
 - [`relationshipTypes()`](#relationshiptypes)
 - [`version()`](#version)
 - [`graph(cypher, [opts, callback])`](#graphsettings-opts-callback)
 - [`queryOne(cypher, [opts])`](#queryonecypher-opts)
 - [`querySync(cypher, [opts])`](#querysynccypher-opts)
 - [`queryAsync(cypher, [opts, callback])`](#queryasynccypher-opts-callback)
 - [`query(cypher, [opts, callback])`](#querysettings-opts-callback)
 - [`cypher(cypher, [opts, callback])`](#cyphercypher-opts-callback)
 - [`batch(tasks, [settings, callback])`](#batchtasks-settings-callback)
 - \[[`Neo4jTransaction`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class)\]: [`transaction([settings, opts])`](#transactionsettings-opts)
 - \[[`Neo4jNode`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class)\]: [`nodes([id, reactive])`](#nodesid-reactive)
 - \[[`Neo4jRelationship`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class)\]: [`relationship.create(from, to, type, [properties])`](#relationshipcreatefrom-to-type-properties)
 - \[[`Neo4jRelationship`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class)\]: [`relationship.get(id, [reactive])`](#relationshipgetid-reactive)
 - [`constraint.create(label, keys, [type])`](#constraintcreatelabel-keys-type)
 - [`constraint.drop(label, key, [type])`](#constraintdroplabel-key-type)
 - [`constraint.get([label, key, type])`](#constraintgetlabel-key-type)
 - [`index.create(label, keys)`](#indexcreatelabel-keys)
 - [`index.get([label])`](#indexgetlabel)
 - [`index.drop(label, key)`](#indexdroplabel-key)

-----

##### **`new Neo4jDB([url, credentials])`**
*Connect to DB*
 - `url` {*String*} - URL to Neo4j like: `http://localhost:7474`, this package supports `https://` protocol. This argument is optional, you may put URL into environment variable `NEO4J_URL` or `GRAPHENEDB_URL`
 - `credentials` {*Object*} - This argument is optional, you may omit it if your Neo4j has no authentication.
 - `credentials.username` {*String*} - Username. Alias: `user`
 - `credentials.password` {*String*} - Password. Alias: `pass`
 - Returns: {*Neo4jDB*}
```js
const Neo4jDB = require('neo4j-fiber').Neo4jDB;
const db = new Neo4jDB('http://localhost:7474', {username: 'neo4j', password: '1234'});
```

-----

##### `propertyKeys()`
*List all property keys ever used in the database*
 - Returns: {*[String]*}
```js
db.propertyKeys();
```

---

##### `labels()`
*List all labels ever used in the database*
 - Returns: {*[String]*}
```js
db.labels();
```

---

##### `relationshipTypes()`
*List all relationship types ever used in the database*
 - Returns: {*[String]*}
```js
db.relationshipTypes();
```

---

##### `version()`
*Return version of Neo4j server we connected to*
 - Returns: {*String*}
```js
db.version();
```

---

##### `graph(settings, [opts, callback])`
*Request results as graph representation, read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html#rest-api-return-results-in-graph-format) for more info*

 - `settings` {*Object* | String} - Cypher query as String or object of settings
 - `settings.cypher` {*String*} - Cypher query, alias: `settings.query`
 - `settings.opts` {*Object*} - Map of cypher query parameters, aliases: `settings.parameters`, `settings.params`
 - `settings.reactive` {*Boolean*} - Reactive nodes updates while retrieve data from [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class). Default: `false`. Alias: `settings.reactiveNodes`
 - `settings.callback` {*Function*} - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
 - `opts` {*Object*} - Map of cypher query parameters
 - `callback` {*Function*} - Callback function. If passed, the method runs asynchronously
 - Returns: {*[Neo4jCursor](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)*}
```js
db.graph("MATCH ()-[r]-() RETURN DISTINCT r").fetch();
db.graph("MATCH ()-[r {props}]-() RETURN DISTINCT r", {props: p1: 'v1', p2: 'v2'}).fetch();
db.graph "MATCH ()-[r]-() RETURN DISTINCT r", (error, cursor) => {
  cursor.fetch();
  // Returns array of arrays nodes and relationships:
  // [{nodes: [{...}, {...}, {...}], relationships: [{...}, {...}, {...}]},
  //  {nodes: [{...}, {...}, {...}], relationships: [{...}, {...}, {...}]},
  //  {nodes: [{...}, {...}, {...}], relationships: [{...}, {...}, {...}]}]
});
```

---

##### `queryOne(cypher, [opts])`
*Shortcut for `query`, which returns first result from your query as plain Object*

 - `cypher` {*String*} - Cypher query as String
 - `opts` {*Object*} - Map of cypher query parameters
 - Returns: {*Object*}
```js
db.queryOne("MATCH (n) LIMIT 1 RETURN n").n;
```

---

##### `querySync(cypher, [opts])`
*Shortcut for `query` (see below for more). Always runs synchronously, but without callback.*

 - `cypher` {*String*} - Cypher query as String
 - `opts` {*Object*} - Map of cypher query parameters
 - Returns: {*[Neo4jCursor](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)*}
```js
db.querySync("MATCH (n) WHERE id(n) = {id} RETURN n", {id: id}).fetch();
```

---

##### `queryAsync(cypher, [opts, callback])`
*Shortcut for `query` (see below for more). Always runs asynchronously, even if no callback is passed. Best option for independent deletions.*

 - `cypher` {*String*} - Cypher query as String
 - `opts` {*Object*} - Map of cypher query parameters
 - `callback` {*Function*} - Callback function with `error` and `cursor` arguments
 - Returns: {*[Neo4jCursor](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)*}
```js
db.queryAsync("MATCH (n) WHERE id(n) = {id} RETURN n", {id: id}, (error, cursor) => {
  cursor.fetch();
});
```

---

##### `query(settings, [opts, callback])`
*Send query to Neo4j via transactional endpoint. This Transaction will be immediately committed. This transaction will be sent inside batch, so if you call multiple async queries, all of them will be sent in one batch in closest (next) event loop. Read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html#rest-api-begin-and-commit-a-transaction-in-one-request) for more info.*

 - `settings` {*Object* | String} - Cypher query as String or object of settings
 - `settings.cypher` {*String*} - Cypher query, alias: `settings.query`
 - `settings.opts` {*Object*} - Map of cypher query parameters, aliases: `settings.parameters`, `settings.params`
 - `settings.reactive` {*Boolean*} - Reactive nodes updates when retrieve data from [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class). Default: `false`. Alias: `settings.reactiveNodes`
 - `settings.callback` {*Function*} - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
 - `opts` {*Object*} - Map of cypher query parameters
 - `callback` {*Function*} - Callback function. If passed, the method runs asynchronously
 - Returns: {*[Neo4jCursor](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)*}
```js
db.query("MATCH (n) RETURN n").fetch();
db.query("MATCH (n) WHERE id(n) = {id} RETURN n", {id},).fetch();
db.query("MATCH (n) RETURN n", (error, cursor) => {
  cursor.fetch();
});
```

---

##### `cypher(cypher, [opts, callback])`
*Send query to Neo4j via cypher endpoint. This query will be sent inside batch, so if you call multiple async queries, all of them will be sent in one batch in closest (next) event loop. Read [reference](http://neo4j.com/docs/rest-docs/3.1/rest-api-cypher.html) for more info.*

 - `settings` {*Object* | String} - Cypher query as String or object of settings
 - `settings.cypher` {*String*} - Cypher query, alias: `settings.query`
 - `settings.opts` {*Object*} - Map of cypher query parameters, aliases: `settings.parameters`, `settings.params`
 - `settings.reactive` {*Boolean*} - Reactive nodes updates while retrieve data from [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class). Default: `false`. Alias: `settings.reactiveNodes`
 - `settings.callback` {*Function*} - Callback function. If passed, the method runs asynchronously. Alias: `settings.cb`
 - `opts` {*Object*} - Map of cypher query parameters
 - `callback` {*Function*} - Callback function. If passed, the method runs asynchronously
 - Returns: {*[Neo4jCursor](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)*}
```js
db.cypher("MATCH (n) RETURN n").fetch();
db.cypher("MATCH (n) WHERE id(n) = {id} RETURN n", {id},).fetch();
db.cypher("MATCH (n) RETURN n", (error, cursor) => {
  cursor.fetch();
});
```

---

##### `batch(tasks, [settings, callback])`
*Send tasks to batch endpoint, this method allows to work directly with Neo4j REST API. Read [reference](http://neo4j.com/docs/rest-docs/3.1/rest-api-batch-ops.html) for more info.*
 - `tasks` {*[Object]*} - Array of tasks
 - `tasks.$.method` {*String*} - HTTP(S) method used sending this task, one of: 'POST', 'GET', 'PUT', 'DELETE', 'HEAD'
 - `tasks.$.to` {*String*} - Endpoint (URL) for task
 - `tasks.$.id` {*Number*} - [Optional] Unique id to identify task. Should be always unique!
 - `tasks.$.body` {*mix*} - [Optional] JSONable object which will be sent as data to task
 - `settings` {*Object*}
 - `settings.reactive` {*Boolean*} - if `true` and if `plain` is true data of node(s) will be updated before returning
 - `settings.plain` {*Boolean*} - if `true`, results will be returned as simple objects instead of [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)
 - Returns: {*[Object]*} - Array of [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)s or array of Objects if `plain` is `true`
```js
const cursors = db.batch([{
  method: "POST",
  to: db.__service.cypher.endpoint,
  body: {
    query: "CREATE (n:BatchTest {data})",
    params: data: BatchTest: true
  }
}, {
  method: "POST",
  to: db.__service.cypher.endpoint,
  body: query: "MATCH (n:BatchTest) RETURN n",
  id: 999
}, {
  method: "POST",
  to: db.__service.cypher.endpoint,
  body: query: "MATCH (n:BatchTest) DELETE n"
}]);

cursors.forEach( (cursor) => {
  if (cursor._batchId === 999) {
    cursor.fetch();
  }
});
```

---

##### `transaction([settings, opts])`
*Open Neo4j Transaction. All methods on [`Neo4jTransaction`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class) instance is chainable. Read [reference](http://neo4j.com/docs/2.3.8/rest-api-transactional.html#rest-api-begin-a-transaction) for more info.*

 - `settings` {*Function* | *Object* | *String* | *[String]*} - [Optional] Cypher query as String or Array of Cypher queries or object of settings
 - `settings.cypher` {*String* | *[String]*} - Cypher query(ies), alias: `settings.query`
 - `settings.opts` {*Object*} - Map of cypher query(ies) parameters, aliases: `settings.parameters`, `settings.params`
 - `settings.resultDataContents` {*[String]*} - Array of contents to return from Neo4j, like: `REST`, `row` or `graph`. Default: `['REST']`
 - `settings.reactive` {*Boolean*} - Reactive nodes updates when retrieve data from [`Neo4jCursor`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class). Default: `false`. Alias: `settings.reactiveNodes`
 - `opts` {*Object*} - [Optional] Map of cypher query(ies) parameters
 - Returns: {*Neo4jTransaction*} - [`Neo4jTransaction`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class) instance
```js
db.transaction("MATCH (n) RETURN n").commit();
db.transaction(["CREATE (n:Person)", "MATCH (n:Person) SET n.id = {id} RETURN n"], {id}).commit()[1].fetch();
```

---

##### `nodes([id, reactive])`
*Create or get node object. If no arguments is passed, then new node will be created. If first argument is number, then node will be fetched from Neo4j. If first argument is Object, then new node will be created with passed properties. Read [reference](http://neo4j.com/docs/rest-docs/3.1/rest-api-nodes.html) for more info.*

 - `id` {*Number* | *Object*}  - [Optional], see description above
 - `reactive` {*Boolean*}  - if passed as `true` - data of node will be updated before returning
 - Returns: {*Neo4jNode*} - [Neo4jNode](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class) instance
```js
db.nodes().get();
db.nodes({prop: 'value'}).get();
db.nodes(123).get();
```

---

##### `relationship.create(from, to, type, [properties])`
*Create relationship between two nodes. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-create-a-relationship-with-properties) for more info.*

 - `from` {*Number* | *[Neo4jNode](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class)*} - id or instance of node
 - `to` {*Number* | *[Neo4jNode](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class)*} - id or instance of node
 - `type` {*String*} - Type (label) of relationship
 - `properties` {*Object*} - Relationship's properties
 - `properties._reactive` {*Boolean*} - Set [`Neo4jRelationship`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class) instance to reactive mode
 - Returns: {*[Neo4jRelationship](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class)*}
```js
db.relationship.create(123, 124, "KNOWS").get();
const n1 = db.nodes();
const n2 = db.nodes();
db.relationship.create(n1, n2, "KNOWS", {prop: 'value'}).get();
db.relationship.create(123, 124, "KNOWS", {prop: 'value', _reactive: true}).get();
```

---

##### `relationship.get(id, [reactive])`
*Get relationship object, by id. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-get-relationship-by-id) for more info.*

 - `id` {*Number*} - Relationship's id
 - `reactive` {*Boolean*} - Set [`Neo4jRelationship`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class) instance to reactive mode
 - Returns: {*[Neo4jRelationship](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class)*}
```js
const r = db.relationship.get(56);
r.property('key', 'value');
r.get();
r.delete();
```

---

##### `constraint.create(label, keys, [type])`
*Create constraint for label. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-create-uniqueness-constraint) for more info.*

 - `label` {*String*} - Label name
 - `keys` {*[String]*} - Keys
 - `type` {*String*} - Constraint type, default `uniqueness`
 - Returns: {*Object*}
```js
db.nodes({uuid: 123}).labels.set('Person');
db.constraint.create('Person', ['uuid']);
```

---

##### `constraint.drop(label, key, [type])`
*Remove (drop) constraint for label. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-drop-constraint) for more info.*

 - `label` {*String*} - Label name
 - `key` {*String*} - Key
 - `type` {*String*} - Constraint type, default `uniqueness`
 - Returns: {*[]*} - Empty array
```js
db.nodes({uuid: 123}).labels.set('Person');
db.constraint.create('Person', ['uuid']);
db.constraint.drop('Person', 'uuid');
```

---

##### `constraint.get(label, key, [type])`
*Get constraint(s) for label, or get all DB's constraints. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-get-a-specific-uniqueness-constraint) for more info.*

 - `label` {*String*} - Label name
 - `key` {*String*} - Key
 - `type` {*String*} - Constraint type, default `uniqueness`
 - Returns: {*[Object]*}
```js
db.nodes({uuid: 123}).labels.set('Person');
db.constraint.create('Person', ['uuid']);
db.constraint.get(); // All DB-wide constraints
db.constraint.get('Person'); // All constraints on label
db.constraint.get('Person', 'uuid'); // Certain constraint on label
```

---

##### `index.create(label, keys)`
*Create index for label. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-create-index) for more info.*

 - `label` {*String*} - Label name
 - `keys` {*[String]*} - Index keys
 - Returns: {*Object*}
```js
db.nodes({uuid: 123}).labels.set('Person');
db.index.create('Person', ['uuid']);
```

---

##### `index.get([label])`
*Get indexes for label. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-list-indexes-for-a-label) for more info.*

 - `label` {*String*} - Label name
 - Returns: {*Object*}
```js
db.nodes({uuid: 123}).labels.set('Person');
db.index.create('Person', ['uuid']);
db.index.get('Person');
db.index.get(); // All DB-wide indexes
```

---

##### `index.drop(label, key)`
*Remove (drop) index for label. Read [reference](http://neo4j.com/docs/rest-docs/3.1/#rest-api-drop-index) for more info.*

 - `label` {*String*} - Label name
 - `key` {*String*} - Index key
 - Returns: {*Object*}
```js
db.nodes({uuid: 123}).labels.set('Person');
db.index.create('Person', ['uuid']);
db.index.drop('Person', 'uuid');
```