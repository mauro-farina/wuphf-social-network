const {MongoClient} = require("mongodb");
const uri = "mongodb://mongosrv:27017";

const client = new MongoClient(uri);

let _db;

module.exports = {
    getDB: () => _db,
    connect: async () => {
        await client.connect;
        _db = client.db("quacker");
    }
}