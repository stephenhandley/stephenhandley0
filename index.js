var Twit  = require('twit');
var Async = require('async');

console.log('starting...');

var creds = require('./creds.json');
var twit = new Twit(creds);

function handleError (error) {
  console.error("OMG THERE WAS ERROR!")
  console.error(error);
}

var TIMEOUT = 120000; //two minutes

// TODO: go to last tweet from this account
var startup_time = Date.now();  //est timezone

var derp = function () {
  twit.get('friends/ids', function(error, reply) {
    if (error) {
      return handleError(error);
    }

    var ids = reply.ids;

    var params = {
      user_id : ids.join(',')
    };

    twit.get('users/lookup', params, function (error, users) {
      if (error) {
        return handleError(error);
      }

      var todo = [];

      users.forEach(function (user) {
        var status = user.status;
        if (!status || status.retweeted_status) { 
          return;
        }
        var time = new Date(status.created_at).getTime();
        if (time > startup_time) {
          todo.push(user);
        }
      });

      var each = function (user, callback) {
        var status = user.status;
        console.log(status);
        var params = { id: status.id_str };

        twit.post('statuses/retweet/:id', params, function (error, reply, response) {
          if (!error) {
            var msg = "retweeted @" + user.screen_name + ': ' + status.text;
            console.log(msg); 
          }
          callback(error);
        });
      };

      Async.eachSeries(todo, each, function (error) {
        if (error) {
          return handleError(error);
        }
        console.log("---------------");
        console.log(todo.length + " found");
        setTimeout(derp, TIMEOUT);
      });
    });
  });
};

derp();