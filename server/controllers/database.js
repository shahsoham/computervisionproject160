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
  // DB part
  // Get a postgres client from the connection pool
  pg.connect(connect, function(err, client, done){
    if (err){
      return console.log('error fetching client from pool', err);
    }
    console.log("Planning to insert data into database");

    // SQL query -> Insert Data:
    client.query("INSERT INTO users (email, username, password, firstname, lastname) VALUES($1, $2, $3, $4, $5)",
                [results.email, results.username, results.password, results.firstname, results.lastname]);
                done();
                console.log("Congradulations! You are registered, please login, and your POST DATA is: ", results.username);
                res.render('login', {login: login, username: results.username, success: req.session.success});

  // res.redirect('/');
  });

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
