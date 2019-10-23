/*
  User passwords

  Sig Nin
  October 21, 2019
*/
const test = false;
const debug = true;

const crypto = require('crypto');

const iters = 9949;
const keyLn = 384;
const algo = 'sha384';

function setPassword (password) {
  if (debug) {
    console.log(`Set password : ${password}`);
  };
  const salt = crypto.randomBytes(16).toString('base64');
  const hash = crypto.pbkdf2Sync(password, salt, iters, keyLn, algo).toString('base64');
  return { salt: salt, hash: hash };
};

function validatePassword (password, salt, hash) {
  if (debug) {
    console.log(`Validate password : ${password} ${salt} ${hash}`);
  };
  const computed_hash = crypto.pbkdf2Sync(password, salt, iters, keyLn, algo).toString('base64');
  return computed_hash === hash;
};

function validateNewPassword (password1, password2) {
  if (debug){
    console.log(`Validate new password : ${password1} ${password2}`);
  };
  // check that both versions of the new password are the same
  if (password1 != password2) {
    console.log(`Password mismatch - ${password1} != ${password2}`);
    const err = 'Passwords must match.';
    return err;
  }
  // check that the new password is at least 8 characters long
  if (password1.length < 8) {
    console.log(`Short password, ${password1} length = ${password1.length}.`);
    const err = `New password invalid - must be at least 8 characters long.`;
    return err;
  }
};

// A quick test ...
if (test) {
  const short = "samiam0";
  const wrong = short + 'h';
  const password = short + 's';
  const result = setPassword(password);
  console.log(result);
  const { salt: pwsalt, hash: pwhash } = result;
  console.log('Length of salt: ' + pwsalt.length);
  console.log('Length of hash: ' + pwhash.length);
  console.log('validate password = ' + password + ' : ' + validatePassword(password, pwsalt, pwhash));
  console.log('validate password = ' + wrong + ' : ' + validatePassword(wrong, pwsalt, pwhash));
  console.log('validate as new - '
    + password + ', '
    + password + ' : '
    + (validateNewPassword(password, password) || 'valid'));
  console.log('validate as new - '
    + password + ', '
    + wrong + ' : '
    + (validateNewPassword(password, wrong) || 'valid'));
    console.log('validate as new - '
      + short + ', '
      + short + ' : '
      + (validateNewPassword(short, short) || 'valid'));
};

module.exports = { setPassword, validatePassword, validateNewPassword };
