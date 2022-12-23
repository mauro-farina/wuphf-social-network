const {MongoClient} = require("mongodb");
require("dotenv").config({ path: './private/settings.env' });

const uri = process.env.MONGODB_URI; // process.env.MONGODB_URI

const client = new MongoClient(uri);

let _db;

module.exports = {
    getDB: () => _db,
    connect: async () => {
        await client.connect;
        _db = client.db("wuphf");
    }
}