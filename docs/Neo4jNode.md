#### *Represents Node, Labels, Degree and Properties API(s)*

*Most basic way to work with nodes.*
*This class is event-driven and most of methods is chainable (every which returns `Neo4jNode`).*

 - [`get()`](#get)
 - [`delete()`](#delete)
 - [`update([force])`](#updateforce)
 - [`degree([direction, types])`](#degreedirection-types)
 - [`to(to, type, [properties])`](#toto-type-properties)
 - [`from(from, type, [properties])`](#fromfrom-type-properties)
 - [`path(to, type, [settings])`](#pathto-type-settings)
 - [`relationships([direction, types, reactive])`](#relationshipsdirection-types-reactive)
 - [`property(name, [value])`](#propertyname-value)
 - [`properties.get([name])`](#propertiesgetname)
 - [`properties.set(name, [value])`](#propertiessetname-value)
 - [`properties.delete([names])`](#propertiesdeletenames)
 - [`properties.update(nameValue)`](#propertiesupdatenamevalue)
 - [`label([labels])`](#labellabels)
 - [`labels.set(labels)`](#labelssetlabels)
 - [`labels.replace(labels)`](#labelsreplacelabels)
 - [`labels.delete(labels)`](#labelsdeletelabels)
 - [`index.create(label, key, [type])`](#indexcreatelabel-key-type)
 - [`index.get(label, key, [type])`](#indexgetlabel-key-type)
 - [`index.drop(label, key, [type])`](#indexdroplabel-key-type)

---

##### [`db.nodes([id, reactive])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#nodesid-reactive)
*Create or get node object.*
 - If no arguments is passed, then new node will be created.
 - If first argument is number, then node will be fetched from Neo4j
 - If first argument is Object, then new node will be created with passed properties

*Might be reactive data source, if `_isReactive` passed as `true` - data of node will be updated before returning.*

 - `id` {*Number* | *Object*}  - [Optional], see description above
 - `reactive` {*Boolean*}  - if passed as `true` - data of node will be updated before returning
 - Returns: {*Neo4jNode*} - Neo4jNode instance
```coffee
db.nodes() # Create new Node
db.nodes {prop: 'value'} # Create new Node, with properties
db.nodes 123 # Get node by id
```

---

##### `get()`
*Retrieve current node's data. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-get-node) for more info.*
 - Returns: {*Object*}
```coffee
n = db.nodes()
n.get()
```

---

##### `delete()`
*Delete current node. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-delete-node) for more info.*
 - Returns: {*undefined*}
```coffee
n = db.nodes()
n.delete()
```

---

##### `update([force])`
*Delete current node. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-nodes.html#rest-api-delete-node) for more info.*
 - `force` {*Boolean*} - If `true` Node will be updated if it is even not "reactive". __Use with caution, may throw exception(s) on non-reactive nodes__
 - Returns: {*Neo4jNode*}
```coffee
n = db.nodes()
n.update()
```

---

##### `degree([direction, types])`
*Return the (`all` | `out` | `in`) number of relationships associated with a node. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-degree.html#rest-api-get-the-degree-of-a-node) for more info.*
 - `direction` {*String*} - Direction of relationships to count, one of: `all`, `out` or `in`. Default: `all`
 - `types` {*[String]*} - Types (labels) of relationship as array
 - Returns: {*Number*}
```coffee
n = db.nodes()
n.degree()
n.degree 'all', ["KNOWS", "LIKES"]
n.degree 'out'
```

---

##### `to(to, type, [properties])`
*Create relationship from current node to another. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-create-a-relationship-with-properties) for more info.*
 - `to` {*Number* | *Neo4jNode*} - Node's id or `Neo4jNode` instance
 - `type` {*String*} - Type (label) of relationship
 - `properties` {*Object*} - Relationship's properties
 - `properties._reactive` {*Boolean*} - Set [`Neo4jRelationship`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class) instance to reactive mode
 - Returns: {*[Neo4jRelationship](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class)*}
```coffee
n1 = db.nodes()
n2 = db.nodes()
r1 = n1.to n2, "KNOWS"
r2 = n2.to n1, "LIKES", {prop: 'value'}
```

---

##### `from(from, type, [properties])`
*Create relationship to current node from another. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-create-a-relationship-with-properties) for more info.*
 - `from` {*Number* | *Neo4jNode*} - Node's id or `Neo4jNode` instance
 - `type` {*String*} - Type (label) of relationship
 - `properties` {*Object*} - Relationship's properties
 - `properties._reactive` {*Boolean*} - Set [`Neo4jRelationship`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class) instance to reactive mode
 - Returns: {*[Neo4jRelationship](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class)*}
```coffee
n1 = db.nodes()
n2 = db.nodes()
r1 = n2.from n1, "KNOWS"
r2 = n1.from n2, "LIKES", {prop: 'value'}
```

---

##### `path(to, type, [settings])`
*Execute Graph Algorithms to find a path between two nodes. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-graph-algos.html) for more info.*
 - `to` {*Number* | *Neo4jNode*} - Neo4jNode instance or Node's id
 - `type` {*String*} - Relationship type
 - `settings` {*Object*} - [OPTIONAL] Object of Graph Algorithm settings
 - `settings.max_depth` {*Number*} - The maximum depth as an integer for the algorithms, default is `3`
 - `settings.algorithm` {*String*} - One of the algorithms: `shortestPath`, `allSimplePaths`, `allPaths` or `dijkstra`. Default is `shortestPath`
 - `settings.` {*String*} - [for `dijkstra` algorithm only] name of relationship property
 - `settings.default_costcost_property` {*Number*} - [REQUIRED for `dijkstra` algorithm if `cost_property` is not defined]
 - `settings.relationships` {*Object*}
 - `settings.relationships.direction` {*String*} - One of `out` or `in`, default is `out`
 - Returns: {*[Object]*} - Array of results
```coffee
n1 = db.nodes()
# ... Assuming we have plenty of nodes
n30 = db.nodes()

n1.to n2, "TANSFER", {distance: 30}
# ... Assuming we have relationships of one type between plenty of nodes
n29.to n30, "TANSFER", {distance: 54}

n1.path(n30, "TRANSFER", max_depth: 30)[0]
# Will return, something like:
# directions: [ '->', .., '->' ]
# start: 1
# nodes: [ 1, .., 30 ]
# length: 28
# relationships: [ 1, .., 28 ]
# end: 30

n30.path(n1, "TRANSFER", {max_depth: 30, relationships: direction: 'in'})[0]
# Will return, something like:
# directions: [ '<-', .., '<-' ]
# start: 30
# nodes: [ 30, .., 1 ]
# length: 28
# relationships: [ 28, .., 30 ]
# end: 1

n1.path(n30, "TRANSFER", {cost_property: 'distance', algorithm: 'dijkstra'})[0]
# Will return, something like:
# directions: [ '->', .., '->' ]
# weight: 8567 # Sum of `distance` properties
# start: 1
# nodes: [ 1, .., 30 ]
# length: 28
# relationships: [ 1, .., 28 ]
# end: 30
```

---

##### `relationships([direction, types, reactive])`
*Get all node's relationships. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-typed-relationships) for more info.*
 - `direction` {*String*} - Direction of relationships to count, one of: `all`, `out` or `in`. Default is `all`
 - `types` {*[String]*} - Array of types (labels) of relationship
 - Returns: {*[Neo4jCursor](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class)*}
```coffee
n = db.nodes(123) # Assuming this node has one or more relationships
n.relationships()
n.relationships('out')
n.relationships('in')
n.relationships('all', ["KNOWS", "LIKES"])
n.relationships('all', ["KNOWS"], true)
```

---

##### `property(name, [value])`
*Set / Get property(ies) on current node, if only first argument is passed - will return property value, if both arguments is presented - property will be updated or created. Read [reference of getting property](http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-get-property-for-node) and [reference of setting property](http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-set-property-on-node) for more info.*
 - `name` {*String*} - Name of the property
 - `value` {*String*} - [OPTIONAL] Value of the property
 - Returns: {*mix* | *Neo4jNode*}
```coffee
n = db.nodes()
n.property('name', "Mike") # Set property
n.property('name') # Get property value, will return: 'Mike'
```

---

##### `properties.get([name])`
*Get current node's property by name or all properties. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-get-properties-for-node) for more info.*
 - `name` {*String*} - [OPTIONAL] Name of the property
 - Returns: {*mix*}
```coffee
n = db.nodes name: "Mike"
n.properties.get 'name' # Get property value, will return: 'Mike'
n.properties.get() # Get all Node's properties, will return: {name: 'Mike'}
```

---

##### `properties.set(name, [value])`
*Set (or override, if exists) multiple property on current node. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-set-property-on-node) for more info.*
 - `name` {*String* | *Object*} - Name of the property or Object of key:value pairs
 - `value` {*mix*} - [OPTIONAL] Value of the property
 - Returns: {*Neo4jNode*}
```coffee
n = db.nodes()
n.properties.set 'createdAt', +new Date
n.properties.set name: "Mike"
n.properties.set location: {lat: x, lon: y}
```

---

##### `properties.delete([names])`
*Delete all or multiple properties by name from a node. If no argument is passed, - all properties will be removed from the node. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-delete-a-named-property-from-a-node) for more info.*
 - `names` {*[String]* | *String* | *null*} - Name or array of property names, pass `null` or call with no arguments to remove all properties
 - Returns: {*Neo4jNode*}
```coffee
n = db.nodes {'createdAt': +new Date, surname: "Ross", name: "Mike", location: {lat: x, lon: y}}
n.properties.delete 'createdAt' # Remove one property
n.properties.delete ['name', 'location'] # Remove multiple properties
n.properties.delete() # Remove all properties
```

---

##### `properties.update(nameValue)`
*This will replace all existing properties on the node with the new set of attributes. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-update-node-properties) for more info.*
 - `nameValue` {*Object*} - Object of key:value pairs
 - Returns: {*Neo4jNode*}
```coffee
n = db.nodes {surname: "Ross", name: "Mike"}
n.properties.update uuid: 357894
n.properties.get() # {uuid: 357894}
```

---

##### `label([labels])`
*Return list of labels, or set new labels. If `labels` parameter is passed to the function new labels will be added to node. Read [reference of getting labels](http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-listing-labels-for-a-node) and [reference of setting labels](http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-adding-multiple-labels-to-a-node) for more info.*
 - `labels` {*[String]*} - [OPTIONAL] Array of Label names
 - Returns: {*Neo4jNode* | *[String]*}
```coffee
n = db.nodes().label(['User', 'Person']).label(['Admin'])
n.label() # Will return ['User', 'Person', 'Admin']
```

---

##### `labels.set(labels)`
*Set one or multiple labels for node. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-adding-a-label-to-a-node) for more info.*
 - `labels` {*String* | *[String]*} - Array of Label names
 - Returns: {*Neo4jNode*}
```coffee
n = db.nodes().labels.set(['User', 'Person']).labels.set 'Admin'
n.label() # ['User', 'Person', 'Admin']
```

---

##### `labels.replace(labels)`
*This removes any labels currently exists on a node, and replaces them with the new labels passed in. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-replacing-labels-on-a-node) for more info.*
 - `labels` {*[String]*} - Array of Label names
 - Returns: {*Neo4jNode*}
```coffee
n = db.nodes().label ['User', 'Person']
n.labels.replace ['Admin']
n.label() # ['Admin']
```

---

##### `labels.delete(labels)`
*Remove one or multiple label(s) from Node. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-node-labels.html#rest-api-removing-a-label-from-a-node) for more info.*
 - `labels` {*String* | *[String]*} - Name or array of Label names to be removed
 - Returns: {*Neo4jNode*}
```coffee
n = db.nodes().label ['User', 'Person', 'Admin']
n.labels.delete 'Admin'
n.label() # ['User', 'Person']
n.labels.delete ['User', 'Person']
n.label() # []
```

---

##### `index.create(label, key, [type])`
*Create index on node for label. __This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting.__*
 - `label` {*String*} - Label name
 - `key` {*String*} - Index key
 - `type` {*String*} - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
 - Returns: {*Object*}
```coffee
n = db.nodes({uuid: 789}).labels.set 'Special'
n.index.create 'Special', 'uuid'
```

---

##### `index.get(label, key, [type])`
*Get indexes on node for label. __This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting.__*
 - `label` {*String*} - Label name
 - `key` {*String*} - Index key
 - `type` {*String*} - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
 - Returns: {*Object*}
```coffee
n = db.nodes({uuid: 789}).labels.set 'Special'
n.index.create 'Special', 'uuid'
n.index.get 'Special', 'uuid'
```

---

##### `index.drop(label, key, [type])`
*Get indexes on node for label. __This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting.__*
 - `label` {*String*} - Label name
 - `key` {*String*} - Index key
 - `type` {*String*} - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
 - Returns: {*[]*} - Empty array
```coffee
n = db.nodes({uuid: 789}).labels.set 'Special'
n.index.create 'Special', 'uuid'
n.index.drop 'Special', 'uuid'
```