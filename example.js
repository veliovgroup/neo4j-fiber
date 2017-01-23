'use strict';

const Neo4jDB = require('./lib/index.js').Neo4jDB;
const Fiber   = require('fibers');
const _       = require('underscore');


/*
After running code below it should output `true` - 11 times
Change credentials below in according with your Neo4j DB
Use NEO4J_URL environment variable as url to Neo4j database, like: 'http://localhost:7474'
 */
Fiber(function () {
  const db = new Neo4jDB(process.env.NEO4J_URL, {
    username: 'neo4j',
    password: '1234'
  });
  console.log(_.isArray(db.query('MATCH (n) RETURN n').fetch()));

  /*
  Transaction test
  Want to see more tests and examples? - Contribute!
   */
  const t = db.transaction('CREATE (n:TransactionsTesting {data}) RETURN n', {
    data: {
      transaction: true
    }
  });

  let current = t.current();
  let node = current[0].fetch()[0];
  t.execute('CREATE (n:TransactionsTesting2 {data}) RETURN n', {
    data: {
      transaction2: true
    }
  });

  current = t.current();
  node = current[1].fetch()[0];
  const result = t.commit();

  console.log(JSON.stringify(db.queryOne('MATCH (n:TransactionsTesting) RETURN n').n) === JSON.stringify(result[0].fetch()[0].n));
  console.log(JSON.stringify(db.queryOne('MATCH (n:TransactionsTesting2) RETURN n').n) === JSON.stringify(result[1].fetch()[0].n));
  db.transaction().commit('MATCH (n:TransactionsTesting), (n2:TransactionsTesting2) DELETE n, n2');
  console.log(db.queryOne('MATCH (n:TransactionsTesting) RETURN n') === void 0);
  console.log(db.queryOne('MATCH (n:TransactionsTesting2) RETURN n') === void 0);
  console.log(_.isArray(db.propertyKeys()));
  console.log(_.isArray(db.labels()));
  console.log(_.isArray(db.relationshipTypes()));
  console.log(_.isString(db.version()));

  /*
  Create, retrieve and remove a node
   */
  const n1 = db.nodes({
    test: true,
    asdasd: 'asjkdhkajs'
  });
  console.log(_.isObject(n1.get()));
  console.log(_.isUndefined(n1.delete()));
  process.exit();
}).run();
