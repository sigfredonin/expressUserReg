/*
  User Management Routes

  Sig Nin
  October 17, 2019

*/
const debug = true;
const express = require('express');
const router = express.Router();
const pw = require('../pw/password.js');

let testIndex = 1;
router.get("/test", (req, res) => {
  const testMessage = `Router test ... ${testIndex}.`;
  console.log(testMessage);
  res.end(testMessage);
  testIndex++;
});

// Create DB connection pool
const mysql = require('mysql');

const db_local = {
  connectionLimit:10,
  host     : 'localhost',
  user     : 'tester',
  password : 'probador!Oct14!',
  database : 'playapp'
};

const db_cloud = {
  connectionLimit:10,
  host     : 'us-cdbr-iron-east-05.cleardb.net',
  user     : 'bb6547e1951f57',
  password : '9694009a',
  database : 'heroku_a5e9b94760bea26'
};

let pool = null;
if (process.env.USE_DB == 'LOCAL') {
  pool = mysql.createPool(db_local);
  console.log("Use local DB.")
} else {
  pool = mysql.createPool(db_cloud);
  console.log("Use cloud DB.")
}

function getConnection() {
  return pool;
};

/* ----------------------------------------------------------------------------
  HTTPS processing - login and user DB update
---------------------------------------------------------------------------- */

// Echo user registration data as json string
function respond_with_json_user_req(req, res, data, type) {
  // Prepare output in JSON format
  let response = {
    first_name : data.first_name,
    last_name  : data.last_name,
    userid     : data.userid
  }
  if (debug == true) {
    response.pw_1 = data.pw_1;
    response.pw_2 = data.pw_2;
  }
  console.log(response);
  res.end(type + " " + JSON.stringify(response));
}

// Process a User Registration POST request
router.post('/process_user_reg', (req, res) => {
  const userid = req.body.userid;
  console.log(`User Registration requested for user ${userid}`);
  if (debug == true) {
    console.log(req.body);
  }
  // validate the proposed password
  if (err = pw.validateNewPassword(req.body.pw_1, req.body.pw_2)) {
    res.status(400);
    res.end(err);
    return;
  }
  const { salt: pwsalt, hash: pwhash } = pw.setPassword(req.body.pw_1);
  const info = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    userid: req.body.userid,
    pwsalt: pwsalt,
    pwhash: pwhash
  };
  let sql = 'INSERT INTO users SET ?';
  getConnection().query(sql, info, (err, result) => {
    if (err) {
      console.log(`Error registering user: ${err}`);
      res.status(500);
      res.end("Server error, could not register user.");
      return;
    }
    console.log(result);
    respond_with_json_user_req(req, res, req.body, "User registered - POST");
  });
});

// Process a User Password Update POST request
router.post('/process_user_pw', (req, res) => {
  const userid = req.body.userid;
  console.log(`Password Update requested for user ${userid}`);
  if (debug == true) {
    console.log(req.body);
  }
  // validate the proposed new password
  if (err = pw.validateNewPassword(req.body.new_1, req.body.new_2)) {
    res.status(400);
    res.end(err);
    return;
  }
  // fetch the current password from the DB
  console.log(`Getting info for user ${userid}`);
  const sql_get = 'SELECT * FROM users WHERE userid = ?';
  getConnection().query(sql_get, [userid], (err, rows, fields) => {
    if (err) {
      console.log(`Error requesting user info: ${err}`);
      res.status(500);
      res.end(`Server error, could not fetch info for userid: ${userid}`);
      return;
    }
    console.log(`Fetched info for user ${userid}`);
    console.log(rows);
    if (rows[0] == null) {
      console.log(`Could not find user ${userid}`);
      res.status(400);
      res.end(`Could not find userid: ${userid}`);
      return;
    }
    const { pwsalt, pwhash } = rows[0];
    // if a current password set, verify it matches what was provided
    console.log(`Current password in DB, salt: ${pwsalt}, hash: ${pwhash}`);
    if (pwhash != null) {
      console.log('Checking hash of given password against hash from DB')
      if (!pw.validatePassword(req.body.new_1, pwsalt, pwhash)) {
        console.log('Current password given is incorrect.');
        res.status(400);
        res.end(`Incorrect password for userid: ${userid}`);
        return;
      }
    } else {
      console.log('No password set - will set new password.')
    }
    // update the password in the DB
    const { salt, hash } = pw.setPassword(req.body.new_1);
    let sql_update = `UPDATE users SET pwsalt = '${salt}', pwhash = '${hash}' WHERE userid = '${userid}'`;
    getConnection().query(sql_update, (err, result) => {
      if (err) {
        console.log(`Error updating password for userid ${userid}: ${err}`);
        res.status(500);
        res.end("Server error, could not update password.");
        return;
      }
      console.log(result);
      res.status(200);
      res.end(`Password updated for userid ${userid}`);
    });
  });
});

// To get an existing user's info
router.get('/user/:id', (req, res) => {
  const userid = req.params.id;
  console.log(`Getting info for user with id = ${userid}`);
  const sql = 'SELECT * FROM users WHERE id = ?';
  getConnection().query(sql, [userid], (err, rows, fields) => {
    if (err) {
      console.log(`Error requesting user info: ${err}`);
      res.status(500);
      res.end();
      return;
    }
    console.log('Fetched info...');
    res.status(200);
    res.json(rows);
  });
});

module.exports = router;
