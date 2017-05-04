var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
var bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.use(expressValidator()); // this starts validator
app.use(expressSession({secret: process.env.SESSION||'secret', saveUninitialized: false, resave: false}));
app.use(express.static(__dirname + '/static')); // add css files into ejs files (static contents)


// tell express what view engine is (here we change view to .ejs)
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// request to the root of the site
// Here we set login as our home page
app.get('/', function(req, res){
  console.log("Test session data: ", req.session, " The end of login page!");
  var login = true;
  var success = req.session.success;
  var errors = req.session.errors;
  res.render('login', {login: login, success: success, errors: errors});
  req.session.errors = null; // reset error properties in session to null
  // req.session.success = true;
});

app.get('/register', function(req, res){
  console.log("Test session data: ", req.session);
  res.render('register', {success:req.session.success, errors: req.session.errors});
  req.session.errors = null; // reset error properties in session to null
  req.session.success = true;
})

// User page, get user's data (here is hard coded, later needs to connet to database)
app.get("/users", function (req, res){
  // var users_arrays = [
  //   {name: "nicole", email: "changtongzhou@gmail.com"},
  //   {name: "alex", email: "alex@gmail.com"},
  //   {name: "james", email: "james@gmail.com"}
  // ];
  // res.render('users', {users: users_arrays});
  res.render('users');
});

app.get('/logout', function(req, res){
  res.redirect('/')
});

// post rout for login page adding user's data to database
app.post('/login-form', function (req, res){
  // check validity
  req.check('email', 'Invalid email address').isEmail();
  req.check('password', 'Password is empty or too short').isLength({min: 4});
  req.check('confirmPassword', 'Your confirmed password does not match with password').equals(req.body.password);
  var errors = req.validationErrors();
  if (errors){
    req.session.errors = errors;
    req.session.success = false;
    for (var i in errors){
      console.log("checking error: " + errors[i].msg);
    }
    res.redirect('/');
    // req.session.errors = null;
  } else{
    req.session.success = true;
    var email = req.body.email;
    console.log("Congradulations! You are logged in, and your POST DATA is: ", req.body);
    res.render('users', {email: email});
  }
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
    // redirect to the /users route
    var username = req.body.username;
    console.log("Congradulations! You are registered, please login, and your POST DATA is: ", username);
    // res.redirect('/');
    var login = false;
    res.render('login', {login: login, username: username, success: req.session.success});
  }


});

app.post('/users-form', function (req, res){
  console.log("Thanks for submitting data, your POST DATA is: ", req.body);
  // redirect to the root route
  res.redirect('/users');
});

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
