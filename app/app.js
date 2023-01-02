const express = require("express");
const app = express();
const authAPIRouter = require("./auth-router.js");
const socialAPIRouter = require("./social-router.js");
const mongoManager = require("./mongodb-manager.js");
const cookieParser = require('cookie-parser');
const { config } = require("dotenv");
require("dotenv").config({ path: './private/settings.env' });
// https://www.geeksforgeeks.org/where-should-secret-keys-should-be-stored-for-a-node-js-app/

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authAPIRouter);
app.use("/api/social", socialAPIRouter);

app.use(express.static(__dirname +"/public/"));;

app.listen(process.env.PORT, async () => {
    console.log(`listening on port ${process.env.PORT}`);
    await mongoManager.connect().then(console.log("Connected to MongoDB"));
});

app.get("/clear/:collectionName", async (req, res) => {
    const mongo = mongoManager.getDB();
    let result;
    try{
        result = await mongo.collection(req.params.collectionName).deleteMany({});
    } catch(error) {
        res.send(`ERROR while deleting documents in collection ${req.params.collectionName}`);
    }
    res.send(`Deleted ${result.deletedCount} documents in collection ${req.params.collectionName}`);
});

app.get("/collection/:name", async (req, res) => {
    const mongo = mongoManager.getDB();
    let allUsersQuery = await mongo.collection(req.params.name).find({}).toArray();
    res.json(allUsersQuery);
});
