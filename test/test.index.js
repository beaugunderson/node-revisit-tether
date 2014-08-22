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
var buffer = 'data:text/plain;charset=utf-8;base64,c29tZSBjb250ZW50IGZvciBhbiBBUEk=';
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
      content: {
        type: 'text',
        data: buffer
      },
      meta: {
        audio: {
          type: '',
          data: ''
        }
      }
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
      content: {
        type: 'text',
        data: buffer
      },
      meta: {
        audio: {
          type: '',
          data: ''
        }
      }
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
      content: {
        type: 'png',
        data: 'some content for an API'
      },
      meta: {
        audio: {
          type: '',
          data: ''
        }
      }
    };

    var count = 0;

    for (var i = 0; i < serviceArr.length; i ++) {
      count ++;

      var scope = nock(serviceArr[i].url)
        .post('/service', serviceArr[i])
        .reply(201, "{ content: { type: 'png', data: 'text " + count +
          "' }, meta: { audio: { type: '', data: '' } } }");

      if (count === serviceArr.length) {
        rt.play(TOKEN, function (err, result) {
          should.not.exist(err);
          done();
        });
      }
    }
  });
});
