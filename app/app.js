const express = require("express");
const app = express();
const authAPIRouter = require("./auth-router.js");
const socialAPIRouter = require("./social-router.js");
const mongoManager = require("./mongodb-manager.js");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use("/api/auth", authAPIRouter);
app.use("/api/social", socialAPIRouter);

app.use(express.static(__dirname +"/public"));

app.listen(8080, async () => {
    console.log("listening on port 8080");
    await mongoManager.connect().then(console.log("Connected to MongoDB"));
    console.log("hey hey! server is up and runnning");
    // either i remove volume (it works but nodemon doesnt)
    // or i add volume (nodemon works, but i need to keep and copy node_modules as well...)
    // https://stackoverflow.com/a/35317425
});
/*
app.get("/test-find", async (req, res) => {
    const mongo = mongoManager.getDB();
    let dbResults = await mongo.collection("socialnetwork").find().toArray();
    console.log(dbResults);
    res.send("done! check console log");
});

app.get("/test-add-1", async (req, res) => {
    console.log("test-add-1");
    const mongo = mongoManager.getDB();
    const document = {
        name: "John",
        age: 18,
        hobbies: ["books", "clothes"]
    };
    console.log("about to add document");
    await mongo.collection("socialnetwork").insertOne(document, async (err, result) => {
        if (err) {
            console.log("oh noooo!");
            console.log(err);
            client.close();
            return;
        } else {
            console.log("no problemo! document added with no problems");
            console.log(await mongo.collection("socialnetwork").find().toArray());
        }
    });
    res.send("done!");
});
*/