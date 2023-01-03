const express = require("express");
const app = express();
const authAPIRouter = require("./auth-router.js");
const socialAPIRouter = require("./social-router.js");
const utilsAPIRouter = require("./private/utils.js");
const mongoManager = require("./mongodb-manager.js");
const cookieParser = require('cookie-parser');
const { config } = require("dotenv");
require("dotenv").config({ path: './private/settings.env' });
// https://www.geeksforgeeks.org/where-should-secret-keys-should-be-stored-for-a-node-js-app/

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authAPIRouter);
app.use("/api/social", socialAPIRouter);
app.use("/api/utils", utilsAPIRouter);

app.use(express.static(__dirname +"/public/"));;

app.listen(process.env.PORT, async () => {
    console.log(`listening on port ${process.env.PORT}`);
    await mongoManager.connect().then(console.log("Connected to MongoDB"));
});
