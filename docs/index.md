[Neo4jDB](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class):
 - [`propertyKeys()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#propertykeys)
 - [`labels()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#labels)
 - [`relationshipTypes()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#relationshiptypes)
 - [`version()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#version)
 - [`graph(cypher, [opts, callback])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#graphsettings-opts-callback)
 - [`queryOne(cypher, [opts])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#queryonecypher-opts)
 - [`querySync(cypher, [opts])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#querysynccypher-opts)
 - [`queryAsync(cypher, [opts, callback])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#queryasynccypher-opts-callback)
 - [`query(cypher, [opts, callback])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#querysettings-opts-callback)
 - [`cypher(cypher, [opts, callback])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#cyphercypher-opts-callback)
 - [`batch(tasks, [settings, callback])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#batchtasks-settings-callback)
 - `Neo4jTransaction` [`transaction([settings, opts])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#transactionsettings-opts)
 - `Neo4jNode` [`nodes([id, reactive])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#nodesid-reactive)
 - `Neo4jRelationship` [`relationship.create(from, to, type, [properties])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#relationshipcreatefrom-to-type-properties)
 - `Neo4jRelationship` [`relationship.get(id, [reactive])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#relationshipgetid-reactive)
 - [`constraint.create(label, keys, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#constraintcreatelabel-keys-type)
 - [`constraint.drop(label, key, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#constraintdroplabel-key-type)
 - [`constraint.get([label, key, type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#constraintgetlabel-key-type)
 - [`index.create(label, keys)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#indexcreatelabel-keys)
 - [`index.get([label])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#indexgetlabel)
 - [`index.drop(label, key)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#indexdroplabel-key)

[Neo4jNode](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class):
 - [`get()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#get)
 - [`delete()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#delete)
 - [`update([force])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#updateforce)
 - [`degree([direction, types])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#degreedirection-types)
 - [`to(to, type, [properties])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#toto-type-properties)
 - [`from(from, type, [properties])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#fromfrom-type-properties)
 - [`path(to, type, [settings])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#pathto-type-settings)
 - [`relationships([direction, types, reactive])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#relationshipsdirection-types-reactive)
 - [`property(name, [value])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#propertyname-value)
 - [`properties.get([name])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#propertiesgetname)
 - [`properties.set(name, [value])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#propertiessetname-value)
 - [`properties.delete([names])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#propertiesdeletenames)
 - [`properties.update(nameValue)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#propertiesupdatenamevalue)
 - [`label([labels])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#labellabels)
 - [`labels.set(labels)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#labelssetlabels)
 - [`labels.replace(labels)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#labelsreplacelabels)
 - [`labels.delete(labels)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#labelsdeletelabels)
 - [`index.create(label, key, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#indexcreatelabel-key-type)
 - [`index.get(label, key, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#indexgetlabel-key-type)
 - [`index.drop(label, key, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#indexdroplabel-key-type)

[Neo4jRelationship](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class):
 - [`get()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#get)
 - [`delete()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#delete)
 - [`property(name, [value])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#propertyname-value)
 - [`properties.get([name])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#propertiesgetname)
 - [`properties.set(name, [value])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#propertiessetname-value)
 - [`properties.delete([names])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#propertiesdeletenames)
 - [`properties.update(nameValue)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#propertiesupdatenamevalue)
 - [`index.create(label, key, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#indexcreatelabel-key-type)
 - [`index.get(label, key, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#indexgetlabel-key-type)
 - [`index.drop(label, key, [type])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jRelationship-Class#indexdroplabel-key-type)

[Neo4jTransaction](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class):
 - [`commit([cypher, opts, callback])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class#commitsettings-opts-callback)
 - [`execute(cypher, [opts])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class#executesettings-opts)
 - [`rollback()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class#rollback)
 - [`resetTimeout()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class#resettimeout)
 - [`current()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class#current)
 - [`last()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jTransaction-Class#last)

[Neo4jCursor](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class):
 - [`fetch()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class#fetch)
 - [`first()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class#first)
 - [`current()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class#current)
 - [`next()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class#next)
 - [`previous()`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class#previous)
 - [`each(callback)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class#eachcallback)
 - [`forEach(callback)`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jCursor-Class#foreachcallback)

Basic usage:
=====
```coffee
# Connect to DB:
db = new Neo4jDB 'http://localhost:7474', {username: 'neo4j', password: '1234'}

# Create some nodes:
users = []
users.push db.nodes(name: 'Frank').labels.set('User')
users.push db.nodes(name: 'Billy').labels.set('User')
users.push db.nodes(name: 'Joe').labels.set('User')
NYC = db.nodes(title: 'NYC').labels.set('City')
Washington = db.nodes(title: 'Washington').labels.set('City')
SF = db.nodes(title: 'San Francisco').labels.set('City')

# Create some relationships:
NYC.to Washington, "TRANSFER", {distance: 226}
Washington.to SF, "TRANSFER", {distance: 2905}

users[0].to users[1], "KNOWS", since: +new Date
users[1].to users[2], "KNOWS", since: +new Date
for user in users
   user.to(NYC, "LIVES AT", since: 0)

# Change some nodes
NYC.property('location', {lat: x, lon: y})
users[1].properties.set(surname: 'Ross')

# Find route between two cities
NYC.path SF, "TRANSFER", {cost_property: 'distance', algorithm: 'dijkstra'}
```