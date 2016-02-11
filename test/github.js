var parser = require("../lib/github");

/* test/my_test.js */
var expect = require('chai').expect;

describe('Github Functions', function () {

  describe('userToWebID', function() {
    it('userToWebID is a function', function () {
      expect( (parser.userToWebID)).to.be.a('function');
    });
    it('userToWebID gives the right output for github username', function () {
      expect(parser.userToWebID('test')).to.equal('https://github.com/test#this');
    });
    it('userToWebID gives the right output for email', function () {
      expect(parser.userToWebID('andrei@fcns.eu')).to.equal('mailto:andrei@fcns.eu');
    });
    it('userToWebID gives the right output for github http', function () {
      expect(parser.userToWebID('https://github.com/user#this')).to.equal('https://github.com/user#this');
    });
  });


});
