/*
    Node.js Express server to process a User Registration request
    or serve a static html file from subfolder public.

    Store user credentials in USERS table, DB PlayApp

    Sig Nin
    October 9, 2019
*/

var debug = true;

// Use HTTPS - get credentials
const fs = require("fs");
const http = require("http");
const https = require("https");
const privateKey = fs.readFileSync("./sslcert/server.key");
const certificate = fs.readFileSync("./sslcert/server.crt");
const credentials = { key: privateKey, cert: certificate };

// Create DB connection
const mysql = require('mysql');
function getConnection() {
  return mysql.createConnection({
    host     : 'localhost',
    user     : 'tester',
    password : 'probador!Oct14!',
    database : 'playapp'
  });
}

// Use Express app
const express = require("express");
const app_https = express();

// Use application/x-www-form-urlencoded parser to decode POST body
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app_https.use(urlencodedParser);

// Use Morgan request logging
const morgan = require('morgan');
app_https.use(morgan('combined'));

// Define user management routes
const router = require('./routes/user.js');
app_https.use(router);

// For static html files in public folder
app_https.use(express.static('public'));

// Run the server
const httpsServer = https.createServer(credentials, app_https);
const https_port = process.env.PORT_HTTPS || 8443;
httpsServer.listen(https_port, function() {
  console.log("Play App server listening on HTTPS port " + https_port);
});
