var express = require('express');
var bodyParser = require('body-parser');
var async = require('async');
var path = require('path');
var couchapp = require('couchapp');
var ddoc = require(__dirname + '/ddocs');
var couchUrl = 'http://localhost:5984';
var nano = require('nano')(couchUrl);
var app = express();
var dbName = 'epochtalk-diffviewer';
var db;
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

nano.db.get(dbName, function(err) {
  if (err) {
    nano.db.create(dbName, function(err) {
      if (err) {
        console.log('Pleases ensure that couchdb is running.');
        return process.exit(1);
      }
      console.log('Database created.');
      db = nano.use(dbName);
      var dbUrl = couchUrl + '/' + dbName;
      couchapp.createApp(ddoc, dbUrl, function(app) {
        app.push();
      });
    });
  }
  else {
    db = nano.use(dbName);
  }
});


app.get('/diff/:postId', function(req, res) {
  var postId = req.params.postId;
  db.get(postId, { revs_info: true }, function(err, body) {

    if (err) {
      console.log(err);
      res.end();
    }
    else {
      var revisionHistory = [];
      var postHistory = [];
      var latestPost;
      // Populate revision history
      body._revs_info.forEach(function(row) {
        if (row.status === 'available') {
          revisionHistory.push(row.rev);
        }
      });

      // Async call to get each revision
      async.eachSeries(revisionHistory, function(rev, cb) {
        db.get(postId, {rev: rev}, function(err, results) {
          if (err) {
            cb(new Error());
          }
          else {
            if (rev !== body._rev) {
              postHistory.push(results.content);
            }
            else if (rev === body._rev) {
              latestPost = results.content;
            }
            cb();
          }
        });
      }, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          res.render('index', { latestPost: latestPost, postHistory: postHistory });
        }
      });
    }
  });
});

app.listen(9000);