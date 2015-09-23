{Neo4jDB} = require './index'
{Fiber, _} = require './helpers'

###
After running code below it should output `true` - 5 times
Change credentials below in according with your Neo4j DB
###
Fiber(->
  db = new Neo4jDB 'http://localhost:7474', {username: 'neo4j', password: '1234'}

  # ###
  # Simple query - should return array, ether with nodes or empty
  # ###
  console.log _.isArray db.query("MATCH n RETURN n").fetch()

  ###
  Transaction test
  Want to see more tests and examples? - Contribute!
  ###
  t = db.transaction "CREATE (n:TransactionsTesting {data}) RETURN n", data: transaction: true
  current = t.current()
  node = current[0].fetch()[0]

  t.execute "CREATE (n:TransactionsTesting2 {data}) RETURN n", data: transaction2: true
  current = t.current()
  node = current[1].fetch()[0]
  result = t.commit()

  console.log JSON.stringify(db.queryOne("MATCH (n:TransactionsTesting) RETURN n").n) is JSON.stringify result[0].fetch()[0].n
  console.log JSON.stringify(db.queryOne("MATCH (n:TransactionsTesting2) RETURN n").n) is JSON.stringify result[1].fetch()[0].n

  db.transaction().commit "MATCH (n:TransactionsTesting), (n2:TransactionsTesting2) DELETE n, n2"
  console.log db.queryOne("MATCH (n:TransactionsTesting) RETURN n") is undefined
  console.log db.queryOne("MATCH (n:TransactionsTesting2) RETURN n") is undefined
  console.log _.isArray db.propertyKeys()
  console.log _.isArray db.labels()
  console.log _.isArray db.relationshipTypes()
  console.log _.isString db.version()
).run()