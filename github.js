var WebSocket = require('ws');
var exec      = require('child_process').exec;
var $rdf      = require('rdflib');
var https     = require('https');
var sha256    = require('sha256');
var GitHubApi = require("github");

var user = process.argv[2] || 'quantumpayments';
var repo = process.argv[3] || 'github';
var type = process.argv[4] || 'issues';

var page = 1;
var commits = [];
var commands = [];
var amount = 50;
var timeout = 0;
var github;

function initGithub() {
  github = new GitHubApi({
      // required
      version: "3.0.0",
      // optional
      debug: true,
      protocol: "https",
      host: "api.github.com", // should be api.github.com for GitHub
      timeout: 5000,
      headers: {
          "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
      }
  });
}


function callback(err, res) {
  for (var i=0; i<res.length; i++) {
    commits.push(res[i]);
  }

  var next = github.hasNextPage(res);
  page++;

  if (next) {

      fetchCommand({
        user: user,
        repo: repo,
        per_page: 100,
        page: page
    }, callback);

  } else {
    finish();
  }

}

function finish() {
  for (i=0; i<commits.length; i++) {
    var commit = commits[i];
    console.log(commit.url);
    var user = commit.user || commit.commit.committer;
    console.log(user.login || user.email);
  }
}

function getResults() {
  if (repo) {
      fetchCommand({
        user: user,
        repo: repo,
        per_page: 100,
        page: page,
    }, callback);
  }
}


initGithub();


var fetchCommand;
if (type === 'issues') {
  fetchCommand = github.issues.repoIssues;
} else if ( type === 'commits' ) {
  fetchCommand = github.repos.getCommits;
} else if ( type === 'comments' ) {
  fetchCommand = github.issues.repoComments;
} else {
  fetchCommand = github.issues.repoIssues;
}

getResults();
