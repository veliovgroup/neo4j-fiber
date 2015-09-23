[![Join the chat at https://gitter.im/VeliovGroup/ostrio-neo4jdriver](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/VeliovGroup/ostrio-neo4jdriver?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

 - This driver was originally developed for [Meteor](https://www.meteor.com/), and it heavily depends from [Fibers](https://www.npmjs.com/package/fibers), so you required to wrap all code into Fiber
 - This package uses [batch operations](http://neo4j.com/docs/2.2.5/rest-api-batch-ops.html) to perform queries, than means if you sending multiple queries to Neo4j in current event loop, all of them will be sent in closest (next) event loop inside of the one batch
 - This package was tested and works like a charm with [GrapheneDB](http://www.graphenedb.com)
 - To find more about how to use Cypher read [Neo4j cheat sheet](http://neo4j.com/docs/2.2.5/cypher-refcard)

Installation
=======
```shell
npm install neo4j-fiber
```

Demo Apps
=======
 - Hosted on [Meteor (GrapheneDB)](http://neo4j-graph.meteor.com) and on [Heroku (GrapheneDB Add-on)](http://neo4j-graph.herokuapp.com)

API:
=======
[Neo4jDB]():
 - [propertyKeys()]()
 - [labels()]()
 - [relationshipTypes()]()
 - [version()]()
 - [graph(cypher, [opts, callback])]()
 - [queryOne(cypher, [opts])]()
 - [querySync(cypher, [opts])]()
 - [queryAsync(cypher, [opts, callback])]()
 - [query(cypher, [opts, callback])]()
 - [cypher(cypher, [opts, callback])]()
 - Neo4jTransaction [transaction([settings, opts])]()
 - Neo4jNode [nodes([id, reactive])]()
 - [relationship.create(from, to, type, [properties])]()
 - [relationship.get(id, [reactive])]()
 - [constraint.create(label, keys, [type])]()
 - [constraint.drop(label, key, [type])]()
 - [constraint.get([label, key, type])]()
 - [index.create(label, keys)]()
 - [index.get([label])]()
 - [index.drop(label, key)]()

[Neo4jNode]():
 - [get()]()
 - [delete()]()
 - [update([force])]()
 - [degree([direction, types])]()
 - [to(to, type, [properties])]()
 - [from(from, type, [properties])]()
 - [path(to, type, [settings])]()
 - [relationships([direction, types, reactive])]()
 - [property(name, [value])]()
 - [properties.get(name)]()
 - [properties.set(name, [value])]()
 - [properties.delete([names])]()
 - [properties.update(nameValue)]()
 - [label([labels])]()
 - [labels.set(labels)]()
 - [labels.replace(labels)]()
 - [labels.delete(labels)]()
 - [index.create(label, key, [type])]()
 - [index.get(label, key, [type])]()
 - [index.drop(label, key, [type])]()

[Neo4jRelationship]():
 - [get()]()
 - [delete()]()
 - [property(name, [value])]()
 - [properties.get(name)]()
 - [properties.set(name, [value])]()
 - [properties.delete([names])]()
 - [properties.update(nameValue)]()
 - [index.create(label, key, [type])]()
 - [index.get(label, key, [type])]()
 - [index.drop(label, key, [type])]()

[Neo4jTransaction]():
 - [commit(cypher, [opts, callback])]()
 - [execute(cypher, [opts])]()
 - [rollback()]()
 - [resetTimeout()]()
 - [current()]()
 - [last()]()

[Neo4jCursor]():
 - [fetch()]()
 - [first()]()
 - [current()]()
 - [next()]()
 - [previous()]()
 - [each()]()
 - [forEach()]()


Basic Usage Examples
=======

#### Connect to Neo4j
```coffeescript
db = new Neo4jDB 'http://localhost:7474', {
    username: 'neo4j'
    password: '1234'
  }
```

#### Run simple query
```coffeescript
cursor = db.query 'CREATE (n:City {props}) RETURN n', 
  props: 
    title: 'Ottawa'
    lat: 45.416667
    long: -75.683333

console.log cursor.fetch()
# Returns array of nodes:
# [{
#   n: {
#     long: -75.683333,
#     lat: 45.416667,
#     title: "Ottawa",
#     id: 8421,
#     labels": ["City"],
#     metadata: {
#       id: 8421,
#       labels": ["City"]
#     }
#   }
# }]

# Iterate through results as plain objects:
cursor.forEach (node) ->
  console.log node
  # Returns node as Object:
  # {
  #   n: {
  #     long: -75.683333,
  #     lat: 45.416667,
  #     title: "Ottawa",
  #     id: 8421,
  #     labels": ["City"],
  #     metadata: {
  #       id: 8421,
  #       labels": ["City"]
  #     }
  #   }
  # }

# Iterate through cursor as `Neo4jNode` instances:
cursor.each (node) ->
  console.log node.n.get()
  # {
  #   long: -75.683333,
  #   lat: 45.416667,
  #   title: "Ottawa",
  #   id: 8421,
  #   labels": ["City"],
  #   metadata: {
  #     id: 8421,
  #     labels": ["City"]
  #   }
  # }
```

#### Create node
```coffeescript
node = db.nodes()
node2 = db.nodes({property: 'value', property2: ['val', 'val2', 'val3']})
```

#### Get node by id
```coffeescript
node = db.nodes(123)
```

#### Delete node
```coffeescript
node.delete()
```

#### Create relationship
```coffeescript
n1 = db.nodes()
relationship = db.nodes().to(n1, "KNOWS", {property: 'value'})
```

#### Delete relationship
```coffeescript
relationship.delete()
```