var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');

var pg = require('pg');
// DB connect String
var connect = "postgres://postgres:nicoleiscool@localhost:5432/cs160";
// var client = new pg.Client(connect);

/* GET home page. */
// router.get('/', function(req, res, next) {
//
//   pg.connect(connect, function(err, client, done){
//     if(err){
//       return console.error('error fetching client from pool', err);
//     }
//     client.query('SELECT * FROM User',function(err, result){
//       done(err);
//       if (err){
//         return console.error('Error running query', err);
//       }
//       res.render('users', {users: result.rows})
//       console.log(result.rows[0].number);
//     })
//   })
// });

// Post methods
router.post('/register-form', function(req, res){
  // Grab data from http request
  var results = {
    email: req.body.email,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username,
    password: req.body.password
  };

  // Get a postgres client from the connection pool
  pg.connect(connect, function(err, client, done){
    if (err){
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    // SQL query -> Insert Data:
    var query = client.query("INSERT INTO User (email, username, firstname, lastname, lastlogin, lastiplocation, createdat) values($1, $2, $3, $4, $5, $6, $7)",
                [email, username, firstname, lastname, current_timestamp, "San Jose",current_timestamp, ]);
                done();
                res.redirect('/');
    // SQL query -> Select Datal
    // var query = client.query("SELECT * FROM User ORDER BY userid ASC");

    // Stream results back one row at a time
    // query.on('row', function(row){
    //   console.log("This is first data in each row: ", row[0]);
    //   results.push(row);
    // });
    //
    // // After all data is returned, close connection and return results
    // query.on('end', function(){
    //   done();
    //   for (var i in results){
    //     console.log("The final data from results: ", results[i]);
    //   }
    //   return res.json(results);
    // })


  })
})

module.exports = router;
