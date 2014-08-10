'use strict';

var level = require('level');
var concat = require('concat-stream');
var request = require('request');
var uuid = require('uuid');
var async = require('async');

var RevisitTether = function (options) {
  if (!options) {
    options = {};
  }

  var dbPath = options.db || './db-tether';

  var db = level(dbPath, {
    createIfMissing: true,
    valueEncoding: 'json'
  });

  this.add = function (service, next) {
    var services = [];

    if (!service.token && !service.content && !service.url) {
      next(new Error('Invalid object properties: requires the properties ' +
        'token, content and url'));
      return;
    }

    db.put(service.token + '!' + Math.floor(Date.now()) + '!' + uuid.v4(), service, function (err) {
      if (err) {
        next(err);
        return;
      }

      next(null, service);
    });
  };

  this.getAll = function (token, next) {
    var rs = db.createValueStream({
      start: token + '!',
      end: token + '!\xff'
    });

    rs.pipe(concat(function (services) {
      next(null, services || {});
    }));

    rs.on('error', function (err) {
      next(err);
    });
  };

  this.play = function (token, next) {
    this.getAll(token, function (err, services) {
      if (err) {
        next(err);
        return;
      }

      var requestPost = function (service, next) {
        request.post(service.url + '/service', { form: {
          content: service.content
        }}, function (err, response, body) {
          content = JSON.parse(body).content
          next(null, content);
        });
      };

      async.reduce(services, services[0].content, function (result, service, done) {
        request.post(service.url + '/service', { form: {
          content: result
        }}, function (err, response, body) {
          done(null, body? JSON.parse(body).content : {});
        });
      }, function (err, finalResult) {
        next(null, {
          content: finalResult
        });
      });
    });
  };
};

module.exports = RevisitTether;