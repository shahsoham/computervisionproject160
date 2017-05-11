var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
var bcrypt = require('bcryptjs');
var fileUpload = require('express-fileupload');
var fs = require('fs');
// var database = require('./server/controllers/database.js');
// var router = require('./server/controllers/database.js')
// Connect DB
var pg = require('pg');
// DB connect String
var connect = "postgres://postgres:nicoleiscool@localhost:5432/cs160";
// var connect = "postgres://postgres:student@localhost:5432/cs160";
// var client = new pg.Client(connect);

app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.use(expressValidator()); // this starts validator
app.use(expressSession({secret: process.env.SESSION||'secret', saveUninitialized: false, resave: false}));
app.use(express.static(__dirname + '/client/static')); // add css files into ejs files (static contents)
app.use (fileUpload());

// tell express what view engine is (here we change view to .ejs)
app.set('views', __dirname + '/client/views');
app.set('view engine', 'ejs');

// request to the root of the site
// Here we set login as our home page
app.get('/', function(req, res){
  // console.log("Test session data: ", req.session, " The end of login page!");
  var login = true;
  var success = req.session.success;
  var errors = req.session.errors;

  res.render('login', {login: login, success: success, errors: errors});
  req.session.errors = null; // reset error properties in session to null
  req.session.success = true;
});

app.get('/register', function(req, res){
  console.log("Test session data: ", req.session);
  res.render('register', {success:req.session.success, errors: req.session.errors});
  req.session.errors = null; // reset error properties in session to null
  req.session.success = true;
})

// User page, get user's data (here is hard coded, later needs to connet to database)
app.get("/users", function (req, res){
  if (req.session.userId) {
    pg.connect(connect, function(err, client, done){
      if(err){
        login =false;
        return console.error('error fetching client from pool', err);
      }
      client.query('SELECT * FROM users WHERE userid = $1', [req.session.userId],function(err, result){
        if (err){
          console.log(err);

        } else if (result.rows.length >0){
          res.render('users', {userid: req.session.userId, username: result.rows[0].username});
        }

      })
    })

  } else {
    res.redirect('/')
  }
});

app.get('/logout', function(req, res){
  req.session.destroy();
  res.redirect('/')
});

// post rout for login page adding user's data to database
app.post('/login-form', function (req, res, next){
  var login = true;
  var login_info = {
    email: req.body.email,
    password: req.body.password
  };

  req.session.success = true;
  // Connect to DB:
  // SQL query -> Insert Data:
  // var user_ps = client.query("SELECT password FROM users WHERE email = $1", [login_info.email]);
  pg.connect(connect, function(err, client, done){
    if(err){
      login =false;
      return console.error('error fetching client from pool', err);
    }
    client.query('SELECT * FROM users WHERE email = $1', [login_info.email],function(err, result){
      done(err);
      if (err){
        login =false;
        return console.error('Error running query', err);
      }
      console.log("Testing what is result!!", result);
      if (result.rows.length > 0){
        if (result.rows[0].password == login_info.password){
          req.session.userId = result.rows[0].userid;
          console.log("Congrates! You are logged in succesfully! ");
          res.redirect('/users');
          // res.render('users', {username: result.rows[0].username, userid: result.rows[0].userid,login: login});
        }
        else{
          login = false;
          req.session.errors = "Sorry, wrong password, please try again!";
          req.session.success = false;
          console.log("what is the error?zzzzzzzzzzzzzzzzzzzzzz ", req.session.errors);
          res.redirect('/');
          // res.render('login', {success: success, errors: errors});
        }
      }
      else{
        login = false;
        req.session.errors = "Sorry, this account does not exist, please try again!";
        req.session.success = false;
        console.log("what is the error?zzzzzzzzzzzzzzzzzzzzzz ", req.session.errors);
        // console.log("Sorry, this account does not exist, please try again!");
        res.redirect('/');
        // res.render('login', {success: success, errors: errors});
      }
    })

  // console.log("Congradulations! You are registered, please login, and your POST DATA is: ", results.username);
  // res.render('login', {login: login, username: results.username, success: req.session.success});
});

  // check validity
  // req.check('email', 'Invalid email address').isEmail();
  // req.check('password', 'Password is empty or too short').isLength({min: 4});
  // req.check('confirmPassword', 'Your confirmed password does not match with password').equals(req.body.password);
  // var errors = req.validationErrors();
  // if (errors){
  //   req.session.errors = errors;
  //   req.session.success = false;
  //   for (var i in errors){
  //     console.log("checking error: " + errors[i].msg);
  //   }
  //   res.redirect('/');
  //   // req.session.errors = null;
  // } else{
  //   req.session.success = true;
  //   var email = req.body.email;
  //   console.log("Congradulations! You are logged in, and your POST DATA is: ", req.body);
  //   res.render('users', {email: email});
  // }
});

// post rout for register page
app.post('/register-form', function (req, res){
  // check validity
  req.check('email', 'Invalid email address').isEmail();
  req.check('password', 'Password is empty or too short').isLength({min: 4});
  req.check('confirmPassword', 'Your confirmed password does not match with password').equals(req.body.password);
  req.check('firstname', 'Firstname is empty or too short').isLength({min: 4});
  req.check('firstname', 'Firstname is too long').isLength({max: 50});
  req.check('lastname', 'Lastname is empty or too short').isLength({min: 4});
  req.check('lastname', 'Lastname is too long').isLength({max: 50});
  req.check('username', 'Username is empty or too short').isLength({min: 4});
  req.check('username', 'Username is too long').isLength({max: 50});

  var errors = req.validationErrors();
  if (errors){
    req.session.errors = errors;
    req.session.success = false;
    for (var i in errors){
      console.log("checking error: " + errors[i].msg);
    }
    res.redirect('/register');
    // req.session.errors = null;
  } else{
    req.session.success = true;
    var login = false;
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
                  req.session.userId = results.userid;
                  res.redirect('/users')
                  // res.render('login', {login: login, username: results.username, success: req.session.success});

    });
  }; // else part


});

app.post('/file-upload', function (req, res, next){
  if (req.session.userId) {

    var login = true;
    var userid = req.session.userId;
    var dir = '/home/jonomint/Desktop/server_files/user/user1_test'
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    if(!req.files){
      // socket emit upload error
      return res.status(400).send('No files were uploaded');
    }
    console.log("Thanks for submitting data, your POST DATA is: ", req.files.myfile); // the uploaded file object
    var file = req.files.myfile
    console.log("This is the file you uploaded: ", file);
    dir = dir+'/'+req.files.myfile.name;
    //move file into a directory
    file.mv(dir, function(err){
      if(err){
        return res.status(500).send(err);
      }
      console.log("file uploaded!!!");
    })

    // System call
    var spawn = require('child_process').spawn;
    var path = './DissectVideo.py';
    // create child process of the script and pass one argument from the request
    var process = spawn('python', [path, dir, userid]);
    process.stdout.on('data', function(data){
      console.log("System python script call is working!!", data);
    })

    // Connect to database;
    pg.connect(connect, function(err, client, done){
      if (err){
        return console.error("error fetching client from pool", err);
      }
      console.log("Connected to database!!!!!");
      //client.query("SELECT max(videoid), imageDirectory from Video where userid=$1 GROUP BY videoid;", [userid])
      client.query("SELECT max(videoid), imageDirectory from \"Video\" where userid=1 GROUP BY videoid;")

    })
    // redirect to the root route
    res.redirect('/users');
  } else {
    res.redirect('/')
  }
});

app.post('/users-form/:userid', function(req, res, next){
  console.log("testing how user id work:", req.params.userid);
})

// post pages/methods:
// First we want get user's info on login pages
// app.post('/', function(req, res){
// Code to add user to db goes here!
// res.redirect ('/users');
// });


// Specify app port
var port = process.env.PORT || 1337;

app.listen(port, function(){
  console.log('http://127.0.0.1:' + port + '/');
});

module.exports = app;
