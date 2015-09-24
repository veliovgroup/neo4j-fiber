#### *Represents Relationship API(s). For more info read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html)*

*Most basic way to work with relationships.*
*Might be reactive data source, if `_isReactive` passed as `true` - data of relationship will be updated before returning.*

*This class is event-driven and most of methods is chainable (every which returns `Neo4jRelationship`).*

 - [`get()`](#get)
 - [`delete()`](#delete)
 - [`property(name, [value])`](#propertyname-value)
 - [`properties.get([name])`](#propertiesgetname)
 - [`properties.set(name, [value])`](#propertiessetname-value)
 - [`properties.delete([names])`](#propertiesdeletenames)
 - [`properties.update(nameValue)`](#propertiesupdatenamevalue)
 - [`index.create(label, key, [type])`](#indexcreatelabel-key-type)
 - [`index.get(label, key, [type])`](#indexgetlabel-key-type)
 - [`index.drop(label, key, [type])`](#indexdroplabel-key-type)

---

#### Create relationship(s) via:
 - [`db.relationship.create(from, to, type, [properties])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#relationshipcreatefrom-to-type-properties)
 - [`db.relationship.get(id, [reactive])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jDB-Class#relationshipgetid-reactive)
 - [`node.to(to, type, [properties])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#toto-type-properties)
 - [`node.from(from, type, [properties])`](https://github.com/VeliovGroup/neo4j-fiber/wiki/Neo4jNode-Class#fromfrom-type-properties)

---

##### `get()`
*Get relationship data. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-relationship-by-id) for more info.*
 - Returns: {*Object*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {since: +new Date}
r.get()
###
Will return object like:
{
  id: 89
  type: "KNOWS"
  start: 645
  end: 646
  since: 1443061267135
  metadata:
    id: 89
    type: "KNOWS"
}
###
```


##### `delete()`
*Delete relationship. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-delete-relationship) for more info.*
 - Returns: {*undefined*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {since: +new Date}
r.delete()
```

---

##### `property(name, [value])`
*Set / Get property on current relationship, if only first argument is passed - will return property value, if both arguments is presented - property will be updated or created. Read [setting reference](http://neo4j.com/docs/2.2.5/rest-api-node-properties.html#rest-api-set-property-on-node) and [getting reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-single-property-on-a-relationship) for more info.*
 - `name` {*String*} - Name of the property
 - `value` {*String*} - [OPTIONAL] Value of the property
 - Returns: {*Neo4jRelationship* | *mix*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS"
r.property 'since', +new Date # Set property
r.property 'since' # Get property, returns: 1443061267135
```

---

##### `properties.get([name])`
*Get current relationship's one property or all properties. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-get-all-properties-on-a-relationship) for more info.*
 - `name` {*String*} - [OPTIONAL] Name of the property
 - Returns: {*mix*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {provider: 'James A.'}
r.property 'since', +new Date # Set property
r.properties.get 'since' # returns: 1443061267135
r.properties.get() # returns: {since: 1443061267135, provider: 'James A.'}
```

---

##### `properties.set(name, [value])`
*Set (or override, if exists) one property on current relationship. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-set-single-property-on-a-relationship) for more info.*
 - `name` {*String* | *Object*} - Name of the property or Object of key:value pairs
 - `value` {*mix*} - [OPTIONAL] Value of the property
 - Returns: {*Neo4jRelationship*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS"
r.properties.set 'since', +new Date
r.properties.set provider: 'James A.'
```

---

##### `properties.delete([names])`
*Delete one or all property(ies) by name from a relationship. If no argument is passed, - all properties will be removed from the relationship.. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationship-properties.html#rest-api-remove-properties-from-a-relationship) for more info.*
 - Returns: {*Neo4jRelationship*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {..mutliple props..}
r.properties.delete 'since' # Remove one property
r.properties.delete ['since', 'provider'] # Remove multiple properties
r.properties.delete() # Remove all properties
```

---

##### `properties.update(nameValue)`
*This ~~will replace all existing properties~~ (not actually due to [this bug](https://github.com/neo4j/neo4j/issues/5341)), it will update existing properties and add new. Read [reference](http://neo4j.com/docs/2.2.5/rest-api-relationships.html#rest-api-set-all-properties-on-a-relationship) for more info.*
 - `nameValue` {*Object*} - Object of key:value pairs
 - Returns: {*Neo4jRelationship*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {since: 1443061267135, provider: 'James A.'}
r.properties.update uuid: 357894
r.properties.get() # {uuid: 357894}
```

---

##### `index.create(label, key, [type])`
*Create index on relationship for type (label). __This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting___.*
 - `label` {*String*} - Label name
 - `key` {*String*} - Index key
 - `type` {*String*} - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
 - Returns: {*Object*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {uuid: 890234}
r.index.create 'KNOWS', 'uuid'
```

---

##### `index.get(label, key, [type])`
*Get indexes on relationship for type (label). __This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting___.*
 - `label` {*String*} - Label name
 - `key` {*String*} - Index key
 - `type` {*String*} - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
 - Returns: {*Object*}
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {uuid: 890234}
r.index.create 'KNOWS', 'uuid'
r.index.get 'KNOWS', 'uuid'
```

---

##### `index.drop(label, key, [type])`
*Drop (remove) index on relationship for type (label). __This API poorly described in Neo4j Docs, so it may work in some different way - we are expecting___.*
 - `label` {*String*} - Label name
 - `key` {*String*} - Index key
 - `type` {*String*} - [OPTIONAL] Indexing type, one of: `exact` or `fulltext`, by default: `exact`
 - Returns: {*[]*} - Empty array
```coffee
n = db.nodes()
r = db.nodes().to n, "KNOWS", {uuid: 890234}
r.index.create 'KNOWS', 'uuid'
r.index.drop 'KNOWS', 'uuid'
```