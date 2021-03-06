var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var passport= require('passport');
var session = require('express-session');
var connectMongo = require('connect-mongo')(session);
var mongoose = require('mongoose');
var uid = require('uid-safe');
require('./models/Posts');
require('./models/Comments');


require('./models/User');
require('./config/passport');

var genuuid = function(){
  return uid.sync(18);
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//mongoose.connect('mongodb://localhost/news');
//mongoose.connect('mongodb.services.clever-cloud.com:27017/bq608aruh0oisb3',{user:'unohyoyqbewibhr',pass:'AfD4l6dxQyDlEuqoFZt6'});
mongoose.connect('mongodb://unohyoyqbewibhr:AfD4l6dxQyDlEuqoFZt6@bq608aruh0oisb3-mongodb.services.clever-cloud.com:27017/bq608aruh0oisb3');
console.log("initializing the sessions..");


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use(session({
  store: new connectMongo({
    mongooseConnection:mongoose.connection,
    ttl:(5*60*60)

  }),
  secret:'MEANapp',
  saveUninitialized:true,
  resave:false,
  cookie:{
    path:"/",
    httpOnly:true,
    maxAge:5*60*1000,
  },
  name:"weekdemo",
  genid:function(req){
    return genuuid()
  }

}))

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});





module.exports = app;
