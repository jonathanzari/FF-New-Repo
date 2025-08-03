import neo4j from 'neo4j-driver';

/*

Utilizing Neo4J Aura DB

*/

const uri = "neo4j+s://c4d21749.databases.neo4j.io";
const user = "neo4j";
const password = "EkBIGLq-bU4-sdz-gd_hlS5rbPjKXaXZhOC_7WoVbWY";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export default driver;
