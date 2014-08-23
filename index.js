'use strict';

var level = require('level');
var concat = require('concat-stream');
var request = require('request');
var uuid = require('uuid');
var async = require('async');
var dataURI = require('data-uri-to-buffer');
var ttl = require('level-ttl');

var RevisitTether = function (options) {
  if (!options) {
    options = {};
  }

  var dbPath = options.db || './db-tether';

  var db = ttl(level(dbPath, {
    createIfMissing: true,
    valueEncoding: 'json'
  }), { checkFrequency: 15000 });

  this.add = function (service, next) {
    var services = [];

    if (!service.token && !service.content && !service.url) {
      next(new Error('Invalid object properties: requires the properties ' +
        'token, content and url'));
      return;
    }

    db.put(service.token + '!' + Math.floor(Date.now()) + '!' + uuid.v4(), service,
      { ttl: 3600000 }, function (err) {

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
      if (err || services.length < 1 || !services[0].content) {
        next(new Error('Token not found'));
        return;
      }

      async.reduce(services, services[0].content.data, function (result, service, done) {
        request({
          method: 'POST',
          json: true,
          url: service.url + '/service',
          body: {
            content: {
              data: result
            },
            meta: service.meta
          }
        }, function (err, response, body) {
          done(null, body && body.content? body.content.data : {});
        });
      }, function (err, finalResult) {
        next(null, {
          content: {
            data: finalResult
          }
        });
      });
    });
  };
};

module.exports = RevisitTether;
