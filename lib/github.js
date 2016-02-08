module.exports = {
  initGithub          : initGithub,
  getAllResults       : getAllResults,
  printResults        : printResults,
  compactResults      : compactResults,
  resultsToWebcredits : resultsToWebcredits
};

var $rdf      = require('rdflib');
var GitHubApi = require("github");
var wc        = require('webcredits');


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
  var defaultDestination = 'https://workbot.databox.me/profile/card#me';
  for (i=0; i<results.length; i++) {
    var res = results[i];
    var cred = {};
    cred.amount = 50;
    cred.currency = defaultCurrency;
    cred.desination = defaultDestination;
    var user = res.user || res.commit.committer;
    cred.source = user.login || user.email;
    cred.description = res.url;
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

  getAllResults(type, user, repo, function(err, results) {
    if (err) {
      console.error(err);
    } else {
      printResults(results);
    }
  });

}

// If one import this file, this is a module, otherwise a library
if (require.main === module) {
  bin(process.argv);
}
