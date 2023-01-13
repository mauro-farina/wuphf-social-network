const {MongoClient} = require("mongodb");
require("dotenv").config({ path: './private/settings.env' });

const client = new MongoClient(process.env.MONGODB_URI);

let _db;

module.exports = {
    getDB: () => _db,
    connect: async () => {
        await client.connect();
        _db = client.db("wuphf");
    }
}