var github = require("../lib/github");

/* test/my_test.js */
var expect = require('chai').expect;

describe('Github Functions', function () {

  describe('initGithub', function() {
    it('initGithub is a function', function () {
      expect( (github.initGithub)).to.be.a('function');
    });
  });

  describe('resultsToWebcredits', function() {
    it('resultsToWebcredits is a function', function () {
      expect( (github.resultsToWebcredits)).to.be.a('function');
    });
  });

  describe('getAllResults', function() {
    it('getAllResults is a function', function () {
      expect( (github.getAllResults)).to.be.a('function');
    });
  });

  describe('printResults', function() {
    it('printResults is a function', function () {
      expect( (github.printResults)).to.be.a('function');
    });
  });

  describe('compactResults', function() {
    it('compactResults is a function', function () {
      expect( (github.compactResults)).to.be.a('function');
    });
  });

});
