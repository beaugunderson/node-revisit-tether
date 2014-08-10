'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var child = require('child_process');
var nock = require('nock');

var RevisitTether = require('../index');
var rt = new RevisitTether({
  db: './test/db-tether'
});

var TOKEN = '12345abc';
var serviceArr = [];

describe('RevisitTether', function () {
  after(function () {
    child.exec('rm -rf ./test/db*');
    nock.cleanAll();
  });

  it('should not add a new service', function (done) {
    rt.add({}, function (err, svc) {
      err.toString().should.equal('Error: Invalid object properties: requires ' +
        'the properties token, content and url');
      done();
    });
  });

  it('should add a new service', function (done) {
    var service = {
      url: 'http://localhost:8000/',
      token: TOKEN,
      content: 'some content for an API'
    };

    rt.add(service, function (err, svc) {
      svc.should.eql(service);
      done();
    });
  });

  it('should get all services for a token', function (done) {
    var service = {
      url: 'http://localhost:3000/',
      token: TOKEN,
      content: 'some new content for an API'
    };

    rt.add(service, function (err) {
      rt.getAll(TOKEN, function (err, services) {
        services.length.should.equal(2);
        serviceArr = services;
        done();
      });
    });
  });

  it('should play back all services for a token', function (done) {
    var service = {
      url: 'http://localhost:3000/',
      token: TOKEN,
      content: 'some new content for an API'
    };

    var count = 0;

    for (var i = 0; i < serviceArr.length; i ++) {
      count ++;

      var scope = nock(serviceArr[i].url)
        .post('/service', serviceArr[i])
        .reply(201, "{ content: 'text '" + "count }");

      if (count === serviceArr.length) {
        rt.play(TOKEN, function (err, result) {
          should.not.exist(err);
          done();
        });
      }
    }
  });
});