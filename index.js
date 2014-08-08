'use strict';

var level = require('level');

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

  this.add = function (service, token, content, next) {
    var serviceItem = {
      service: service,
      token: token,
      content: content
    };

    db.put(token + '!' + service, content, function (err) {
      if (err) {
        next(err);
        return;
      }
        
      this.services.push(serviceItem);

      next(null, service);
    });
  };

  this.play = function (token) {
    
  };
};