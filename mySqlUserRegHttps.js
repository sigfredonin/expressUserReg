/*
    Node.js Express server to process a User Registration request
    or serve a static html file from subfolder public.

    Store user credentials in USERS table, DB PlayApp

    Sig Nin
    October 9, 2019
*/

var debug = true;

// Use Express app
const express = require("express");
const app = express();

// Use application/x-www-form-urlencoded parser to decode POST body
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);

// Use Morgan request logging
const morgan = require('morgan');
app.use(morgan('combined'));

// Define user management routes
const router = require('./routes/user.js');
app.use(router);

// For static html files in public folder
app.use(express.static('public'));

// Run the server
const http = require("http");
const httpServer = http.createServer(app);
const port = process.env.PORT || 8081;
httpServer.listen(port, function() {
  console.log("Play App server listening on http port " + port);
});
