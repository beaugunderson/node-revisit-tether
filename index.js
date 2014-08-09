'use strict';

var level = require('level');
var concat = require('concat-stream');
var request = require('request');

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

    db.put(service.token + '!' + Math.floor(Date.now()), service, function (err) {
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
    var count = 0;

    var postToService = function (services, service) {
      setImmediate(function () {
        count ++;

        request.post(service.url, { form: {
          content: service.content
        }}, function (err, response, body) {
          console.log()
          if (count === services.length) {
            next(null, body || {});
          }
        });
      });
    };

    this.getAll(token, function (err, services) {
      if (err) {
        next(err);
        return;
      }

      services.forEach(function (service) {
        postToService(services, service);
      });
    });
  };
};

module.exports = RevisitTether;