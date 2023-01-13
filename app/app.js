const express = require("express");
const app = express();
const authRouter = require("./routers/auth.js");
const socialRouter = require("./routers/social.js");
const utilsAPIRouter = require("./private/utils.js");
const mongoManager = require("./mongodb-manager.js");
const cookieParser = require('cookie-parser');
const { config } = require("dotenv");
require("dotenv").config({ path: './private/settings.env' });
// https://www.geeksforgeeks.org/where-should-secret-keys-should-be-stored-for-a-node-js-app/

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/social", socialRouter);
app.use("/api/utils", utilsAPIRouter);

app.use(express.static(__dirname +"/public/", { extensions: ['html'] }));
/*
    { extensions: ['html'] }
    allows to 'GET' static files that end with .html without specifying the file extensions
    therefore browser URL bar can display /home instead of /home.html, if wanted
*/

app.listen(process.env.PORT, async () => {
    console.log(`listening on port ${process.env.PORT}`);
    await mongoManager.connect().then(console.log("Connected to MongoDB"));
});

app.get('/auth/signup', (req, res) => {
    res.redirect('/auth');
});