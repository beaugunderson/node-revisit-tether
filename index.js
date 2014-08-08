'use strict';

var level = require('level');
var concat = require('concat-stream');

var RevisitTether = function (options) {
  if (!options) {
    options = {};
  }

  this.services = [];

  var dbPath = options.db || './db-tether';

  var db = level(dbPath, {
    createIfMissing: true,
    valueEncoding: 'json'
  });

  this.add = function (url, token, content, next) {
    var serviceItem = {
      url: url,
      token: token,
      content: content
    };

    db.put(token + '!' + Math.floor(Date.now()), serviceItem, function (err) {
      if (err) {
        next(err);
        return;
      }
        
      this.services.push(serviceItem);

      next(null, service);
    });
  };

  this.getAll = function (token, next) {
    var rs = db.createReadStream({
      start: token + '!',
      end: token + '!\xff'
    });

    rs.pipe(concat(function (services) {
      next(null, {
        services: services || []
      });
    }));
      
    rs.on('error', function (err) {
      next(err);
    });
  };

  this.play = function (token) {

  };
};