# revisit.link tether

This runs a batch of API services together and returns the end result.

## Usage

    var RevisitTether = require('revisit-tether');
    var rt = new RevisitTether({
      db: './db-tether'
    });

## Add

    var service = {
      url: 'http://localhost:8000/service',
      token: '12345abc',
      content: {
        message: 'some content for an API'
      }
    };

## Get all services for a token

    rt.getAll('12345abc', function (err, services) {
      console.log(services);
    });

## Play back all services

    rt.play('12345abc', function (err, result) {
      console.log(result);
    });