module.exports = {
  initGithub          : initGithub,
  getAllResults       : getAllResults,
  printResults        : printResults,
  compactResults      : compactResults,
  resultsToWebcredits : resultsToWebcredits,
  userToWebID         : userToWebID
};

var $rdf      = require('rdflib');
var GitHubApi = require("github");
var wc        = require('webcredits');
var async     = require('async');
var program   = require('commander');

/**
 * Get a github API object
 * @return {object} github API object
 */
function initGithub() {
  github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    // debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    timeout: 5000,
    headers: {
      "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
    }
  });
  return github;
}



/**
 * gets all github resuts
 * @param  {String} type issues | commits | comments
 * @param  {String} user user
 * @param  {String} repo repo
 * @param  {Object} callback
 */
function getAllResults(type, user, repo, callback) {

  var page = 1;
  var results = [];
  var commands = [];
  var amount = 50;
  var timeout = 0;

  var fetchCommand;

  var github = initGithub();

  if (type === 'issues') {
    fetchCommand = github.issues.repoIssues;
  } else if ( type === 'commits' ) {
    fetchCommand = github.repos.getCommits;
  } else if ( type === 'comments' ) {
    fetchCommand = github.issues.repoComments;
  } else {
    fetchCommand = github.issues.repoIssues;
  }


  if (repo) {
    fetchCommand({
      user: user,
      repo: repo,
      per_page: 100,
      page: page,
    }, nextFetch);
  }

  function nextFetch(err, res) {
    for (var i=0; i<res.length; i++) {
      results.push(res[i]);
    }

    var next = github.hasNextPage(res);
    page++;

    if (next) {

      fetchCommand({
        user: user,
        repo: repo,
        per_page: 100,
        page: page
      }, nextFetch);

    } else {
      finish();
    }

  }

  function finish() {
    callback(null, results);
  }

}

/**
 * prints results to screen
 */
function printResults(results) {
  var compact = resultsToWebcredits(results);
  console.log(compact);
}

/**
 * inserts results into web credits
 * @param  {[type]} results results
 * @param  {Object} config  the config
 */
function insertResults(results, config) {
  var credits = resultsToWebcredits(results);

  var q = async.queue(function (task, callback) {
    var sequelize = wc.setupDB(config);
    wc.getCredit(credits[task.name], sequelize, config, function(err, res) {
      console.log(res);
      if (err) {
        console.error(err);
      } else {
        if (res) {
          console.log('result');
          callback();
        } else {
          console.log('not found, inserting');
          var sequelize = wc.setupDB(config);
          wc.insert(credits[task.name], sequelize, config, callback);
        }
      }
    });
  }, 1);


  q.drain = function() {
      console.log('all items have been processed');
  };

  function finish(err) {
    console.log('finished processing');
  }

  for (var i = 0; i < credits.length; i++) {
    q.push({name: i}, finish);
  }

}

/**
 * returns a lookup table of webids
 * @return {Array} Lookup table of webids
 */
function getWebIDLookup() {
  lookup = { 'mailto:melvincarvalho@gmail.com' : 'http://melvincarvalho.com/#me' };
  return lookup;
}

/**
 * changes a user to a webid
 * @param  {String} user the user
 * @return {String}      the webid
 */
function userToWebID(user) {
  var lookup = getWebIDLookup();
  var webid = user;

  // check http
  if (webid.indexOf('http') === 0) {
    return webid;
  }

  // check email
  if (webid.indexOf('@') > 0) {
    return 'mailto:' + webid;
  }

  // lookup
  if (lookup[webid]) {
    return lookup[webid];
  }

  // check normal string
  return 'https://github.com/' + user + '#this';

}


/**
 * compact the results
 * @param  {Array} results github results
 * @return {Array}         compacted results : user , uri
 */
function compactResults(results) {
  var ret = [];
  for (i=0; i<results.length; i++) {
    var res = results[i];
    var cred = {};
    cred.url = res.url;
    var user = res.user || res.commit.committer;
    cred.user = user.login || user.email;
    cred.user = userToWebID(cred.user);
    ret.push(cred);
  }

  return ret;
}


/**
 * results to webcresits
 * @param  {Array} results github results
 * @return {Array}         results as webcredits
 */
function resultsToWebcredits(results) {
  var ret = [];
  var defaultCurrency = 'https://w3id.org/cc#bit';
  var defaultSource = 'https://workbot.databox.me/profile/card#me';
  for (i=0; i<results.length; i++) {
    var res = results[i];
    var cred = {};
    cred["https://w3id.org/cc#amount"] = 30;
    cred["https://w3id.org/cc#currency"] = defaultCurrency;
    var user = res.user || res.commit.committer;
    cred["https://w3id.org/cc#source"] = defaultSource;
    cred["http://purl.org/dc/terms/description"] = res.url;
    cred["https://w3id.org/cc#destination"] = userToWebID(user.login || user.email);
    ret.push(cred);
  }

  return ret;
}

/**
* run as bin
*/
function bin(argv) {

  var type = process.argv[2] || 'issues';
  var user = process.argv[3] || 'quantumpayments';
  var repo = process.argv[4] || 'github';

  program
  .option('-d, --database <database>', 'Database')
  .option('-w, --wallet <wallet>', 'Wallet')
  .parse(argv);

  var defaultDatabase = 'webcredits';
  var defaultWallet   = 'https://localhost/wallet/test#this';

  var config = wc.getConfig();
  config.database = program.database || config.database || defaultDatabase;
  config.wallet   = program.wallet   || config.wallet   || defaultWallet;

  getAllResults(type, user, repo, function(err, results) {
    if (err) {
      console.error(err);
    } else {
      insertResults(results, config);
    }
  });

}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}
