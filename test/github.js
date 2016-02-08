var github = require("../lib/github");

/* test/my_test.js */
var expect = require('chai').expect;

describe('Github Functions', function () {

  describe('initGithub', function() {
    it('initGithub is a function', function () {
      expect( (github.initGithub)).to.be.a('function');
    });
  });

});
