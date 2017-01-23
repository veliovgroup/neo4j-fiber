[![Join the chat at https://gitter.im/VeliovGroup/neo4j-fiber](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/VeliovGroup/neo4j-fiber?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

 - Version for Meteor.js - https://atmospherejs.com/ostrio/neo4jdriver
 - This this library is heavily depends from [Fibers](https://www.npmjs.com/package/fibers), so you required to wrap all code into Fiber, see [example](https://github.com/VeliovGroup/neo4j-fiber/blob/master/example.js)
 - This package uses [batch operations](http://neo4j.com/docs/rest-docs/3.1/#rest-api-batch-ops) to perform queries. Batch operations lets you execute multiple API calls through a single HTTP call. This improves performance for large insert and update operations significantly
 - This package was tested and works like a charm with [GrapheneDB](http://www.graphenedb.com)
 - To find more about how to use Cypher read [Neo4j cheat sheet](https://neo4j.com/docs/cypher-refcard/3.1/)

Installation
=======
```shell
npm install --save neo4j-fiber
```

Demo Apps
=======
 - Hosted at [Heroku (GrapheneDB Add-on)](http://neo4j-graph.herokuapp.com)
 - Check out it's [source code](https://github.com/VeliovGroup/neo4j-demo)

API:
=======
Please see full API with examples in [our wiki](https://github.com/VeliovGroup/neo4j-fiber/wiki)


Basic Usage Examples
=======
#### Connect to Neo4j
```js
const Neo4jDB = require('neo4j-fiber').Neo4jDB;
const db = new Neo4jDB('http://localhost:7474', {
  username: 'neo4j',
  password: '1234'
});
```

#### Set connection URL via environment variables
Set `NEO4J_URL` or `GRAPHENEDB_URL` to as connection URL to Neo4j Database
```shell
NEO4J_URL="http://neo4j:1234@localhost:7474" node index.js
```

If environment variable is set, no need to pass `url` argument into `Neo4jDB` constructor
```js
const Neo4jDB = require('neo4j-fiber').Neo4jDB;
const db = new Neo4jDB();
```


#### Run simple query
```js
const cursor = db.query('CREATE (n:City {props}) RETURN n', {
  props: {
    title: 'Ottawa',
    lat: 45.416667,
    long: -75.683333
  }
});

console.log(cursor.fetch());
// Returns array of nodes:
// [{
//   n: {
//     long: -75.683333,
//     lat: 45.416667,
//     title: "Ottawa",
//     id: 8421,
//     labels": ["City"],
//     metadata: {
//       id: 8421,
//       labels": ["City"]
//     }
//   }
// }]

// Iterate through results as plain objects:
cursor.forEach((node) => {
  console.log(node)
  // Returns node as Object:
  // {
  //   n: {
  //     long: -75.683333,
  //     lat: 45.416667,
  //     title: "Ottawa",
  //     id: 8421,
  //     labels": ["City"],
  //     metadata: {
  //       id: 8421,
  //       labels": ["City"]
  //     }
  //   }
  // }
});

// Iterate through cursor as `Neo4jNode` instances:
cursor.each((node) => {
  console.log(node.n.get());
  // {
  //   long: -75.683333,
  //   lat: 45.416667,
  //   title: "Ottawa",
  //   id: 8421,
  //   labels": ["City"],
  //   metadata: {
  //     id: 8421,
  //     labels": ["City"]
  //   }
  // }
});
```

#### Create node
```js
const node  = db.nodes();
const node2 = db.nodes({property: 'value', property2: ['val', 'val2', 'val3']});
```

#### Get node by id
```js
const node = db.nodes(123);
```

#### Delete node
```js
node.delete();
```

#### Create relationship
```js
const n1 = db.nodes();
const relationship = db.nodes().to(n1, "KNOWS", {property: 'value'});
```

#### Delete relationship
```js
relationship.delete();
```

#### Cities example
```js
// Create some data:
const cities = {};
cities['Zürich'] = db.nodes({
  title: 'Zürich',
  lat: 47.27,
  long: 8.31
}).label(['City']);

cities['Tokyo'] = db.nodes({
  title: 'Tokyo',
  lat: 35.40,
  long: 139.45
}).label(['City']);

cities['Athens'] = db.nodes({
  title: 'Athens',
  lat: 37.58,
  long: 23.43
}).label(['City']);

cities['Cape Town'] = db.nodes({
  title: 'Cape Town',
  lat: 33.55,
  long: 18.22
}).label(['City']);


// Add relationship between cities
// At this example we set distance
cities['Zürich'].to(cities['Tokyo'], "DISTANCE", {m: 9576670, km: 9576.67, mi: 5950.67});
cities['Tokyo'].to(cities['Zürich'], "DISTANCE", {m: 9576670, km: 9576.67, mi: 5950.67});

// Create route 1 (Zürich -> Athens -> Cape Town -> Tokyo)
cities['Zürich'].to(cities['Athens'], "ROUTE", {m: 1617270, km: 1617.27, mi: 1004.93, price: 50});
cities['Athens'].to(cities['Cape Town'], "ROUTE", {m: 8015080, km: 8015.08, mi: 4980.34, price: 500});
cities['Cape Town'].to(cities['Tokyo'], "ROUTE", {m: 9505550, km: 9505.55, mi: 5906.48, price: 850});

// Create route 2 (Zürich -> Cape Town -> Tokyo)
cities['Zürich'].to(cities['Cape Town'], "ROUTE", {m: 1617270, km: 1617.27, mi: 1004.93, price: 550});
cities['Cape Town'].to(cities['Tokyo'], "ROUTE", {m: 9576670, km: 9576.67, mi: 5950.67, price: 850});

// Create route 3 (Zürich -> Athens -> Tokyo)
cities['Zürich'].to(cities['Athens'], "ROUTE", {m: 1617270, km: 1617.27, mi: 1004.93, price: 50});
cities['Athens'].to(cities['Tokyo'], "ROUTE", {m: 9576670, km: 9576.67, mi: 5950.67, price: 850});

// Get Shortest Route (in km) between two Cities:
const shortest  = cities['Zürich'].path(cities['Tokyo'], "ROUTE", {cost_property: 'km', algorithm: 'dijkstra'})[0];
let shortestStr = 'Shortest from Zürich to Tokyo, via: ';
shortest.nodes.forEach((id) => {
  shortestStr += db.nodes(id).property('title') + ', ';
});

shortestStr += '| Distance: ' + shortest.weight + ' km';
console.info(shortestStr); // <-- Shortest from Zürich to Tokyo, via: Zürich, Cape Town, Tokyo, | Distance: 11122.82 km

// Get Cheapest Route (in notional currency) between two Cities:
const cheapest  = cities['Zürich'].path(cities['Tokyo'], "ROUTE", {cost_property: 'price', algorithm: 'dijkstra'})[0];
let cheapestStr = 'Cheapest from Zürich to Tokyo, via: ';
cheapest.nodes.forEach((id) => {
  cheapestStr += db.nodes(id).property('title') + ', ';
});

cheapestStr += '| Price: ' + cheapest.weight + ' nc';
console.info(cheapestStr); // <-- Cheapest from Zürich to Tokyo, via: Zürich, Athens, Tokyo, | Price: 900 nc
```

*For more complex examples and docs, please see [our wiki](https://github.com/VeliovGroup/neo4j-fiber/wiki)*