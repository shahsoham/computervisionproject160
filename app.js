// Authors: Changtong Zhou, Bundit Hongmanee, Jonathan Neel, Soham Shah
// Date: May 15, 2017

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
var bcrypt = require('bcryptjs');
var fileUpload = require('express-fileupload');
var fs = require('fs');

// Connect DB
var pg = require('pg');
// DB connect String, the string cannot be changed to your own db
var connect = "postgres://postgres:student@localhost:5432/cs160";
// var client = new pg.Client(connect);
// Runs python scripts
var child = require('child_process');
// moving files
var path = require('path');



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
          console.log("video path is: ", req.session.videoPath);
          res.render('users', {userid: req.session.userId, username: result.rows[0].username, videoPath: req.session.videoPath});
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
        }
        else{
          login = false;
          req.session.errors = "Sorry, wrong password, please try again!";
          req.session.success = false;
          console.log("what is the error?", req.session.errors);
          res.redirect('/');
        }
      }
      else{
        login = false;
        req.session.errors = "Sorry, this account does not exist, please try again!";
        req.session.success = false;
        console.log("what is the error? ", req.session.errors);
        res.redirect('/');
      }
    })
});
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
                  console.log("Here is your userId: ");
                  res.redirect('/')
    });
  }; 


});

function DissectVideo(dir, clientid, userid){
  // System call for process 1
  var path = './DissectVideo.py';
  // create child process of the script and pass one argument from the request
  var process = child.execFile('python', [path, dir, userid], function(error, stdout, stderr){
    if (error){
      io.sockets.connected[clientid].emit('file_upload_status', {status: "Failed to dissect video.", error:true});
      console.log(error);
    } else {
      getMetaData(clientid, userid);
    }
  });
  // end of process 1
}

function getMetaData(clientid, userid){
  console.log("Dissected Video");
  // Connect to database;
  pg.connect(connect, function(err, client, done){
    if (err){
      return console.error("error fetching client from pool", err);
    }
    console.log("Connected to database", userid);
    client.query('SELECT videoid, imagedirectory  from \"Video\" where userid=$1 ORDER BY videoid DESC limit 1', [userid],function(err, result){
      if (err){
        io.sockets.connected[clientid].emit('file_upload_status', {status: "Failed to get Meta-Data", error:true});
        console.log(err);
      } else {
        io.sockets.connected[clientid].emit('file_upload_status', {status: "Getting facial landmarks..."});
        var videoid = result.rows[0].videoid;
        var imageDirectory = result.rows[0].imagedirectory + '/';
        console.log("success got video id ", videoid, imageDirectory);

        GetDataPoints(imageDirectory, videoid, clientid, userid);
      }
    })
  })
}

function GetDataPoints(imageDirectory, videoid, clientid, userid){
  // process 2
  var path = './DlibGetDataPoints.py'
  var process = child.execFile('python', [path, imageDirectory, videoid], function(error, stdout, stderr){
    if (error){
      io.sockets.connected[clientid].emit('file_upload_status', {status: "Failed to get facial landmarks.", error:true});
      console.log(error);
    } else {
      io.sockets.connected[clientid].emit('file_upload_status', {status: "Getting pupil data..."});
      console.log("Got the facial landmarks successfully")
      GetEyePoints(imageDirectory, videoid, clientid, userid);
    }
  });
  // end of process 2
}

function GetEyePoints(imageDirectory, videoid, clientid, userid){
  // process 3
  var path = 'eyeLike/EyePoints.py'
  var process = child.execFile('python', [path, imageDirectory, videoid], function(error, stdout, stderr){
    if (error){
      io.sockets.connected[clientid].emit('file_upload_status', {status: "Failed to get pupil data.", error:true});
      console.log(error);
    } else {
      io.sockets.connected[clientid].emit('file_upload_status', {status: "Drawing delaunay triangles..."});
      console.log("Got the pupil points successfully...");
      MakeDelaunayDrawing(imageDirectory, videoid, clientid, userid);
    }
  });
  // end of process 3
}
function MakeDelaunayDrawing(imageDirectory, videoid, clientid, userid){
  // process4
  var path4 = './DelaunayDrawing.py'
  var process4 = child.execFile('python', [path4, imageDirectory, videoid], function(error, stdout, stderr){
    if (error){
      io.sockets.connected[clientid].emit('file_upload_status', {status: "Failed to draw delaunay triangles.", error:true});
      console.log(error);
    } else {
      io.sockets.connected[clientid].emit('file_upload_status', {status: "Video complete!"});
      console.log("drew the delaunay triangles and stitched the video")
      // end of process 4
      var videoPath = '/home/jonomint/Desktop/CV_project/users/user_' + userid +'/'+ videoid + '.mp4'
      // io.sockets.connected[clientid].emit('get_video_path', {path: videoPath});
      console.log("hey videoPath: ", videoPath);
      moveFileToLocalFolder(videoPath, clientid, videoid);
    }
  });
}

function moveFileToLocalFolder(src, clientid, videoid){

  var localPath = './client/static/processed_videos/'+videoid+'.mp4';
  var dest = path.join(__dirname, localPath);

  copyFile(src, dest, function(){
    io.sockets.connected[clientid].emit('get_video_path', {videoid: videoid});
  });
}
function copyFile(src, dest, done) {

  var readStream = fs.createReadStream(src);

  readStream.once('error', (err) => {
    console.log(err);
  });

  readStream.once('end', () => {
    console.log('done copying');
    done();
  });

  readStream.pipe(fs.createWriteStream(dest));
}




app.post('/file-upload/:clientId', function (req, res, next){
  if (req.session.userId) {
    console.log("clientId:", req.params.clientId);
    var login = true;
    var userid = req.session.userId;
    var clientid = req.params.clientId;
    //var dir = '/home/jonomint/Desktop/server_files/user/user1_test'
    var dir = '/home/jonomint/Desktop/server_files/user/'+ userid;
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    if(!req.files){
      // socket emit upload error
      console.log("upload error");
      // console.log("sockets:\n", io.sockets.connected[clientid]);
      io.sockets.connected[clientid].emit('file_upload_status', {status: "No files were uploaded"})
      // return res.status(400).send('No files were uploaded');
    } else {
      console.log(req.files.upload)
      var file = req.files.upload;

      console.log("Thanks for submitting data, your POST DATA is: ", file.name); // the uploaded file object
      // console.log("This is the file you uploaded: ", file);
      dir = dir+'/'+file.name;
      //move file into a directory
      file.mv(dir, function(err){
        if(err){
          console.log("Failed to save file", err);
          io.sockets.connected[clientid].emit('file_upload_status', {status: "Failed to save file", error:true})
        } else {
          io.sockets.connected[clientid].emit('file_upload_status', {status: "File uploaded. Spliting video.."})
          var videoPath = DissectVideo(dir, clientid, userid);
          // console.log("video path is: ", req.session.videoPath);
        }
      })
    }
    res.status(200).send("done")
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
var server = app.listen(port, function(){
  console.log('http://127.0.0.1:' + port + '/');
});


// Open sockets
var io = require('socket.io')(server);

io.on('connection', function(client){
  console.log("Socket connected:", client.id)
  client.emit('connected', {clientId: client.id})

  // client.on('disconnect', function(){});
});


module.exports = app;
