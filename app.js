var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var animeRouter = require('./routes/anime');
var CountryRouter = require('./routes/country');
var ProducerRouter = require('./routes/producer');

var mongoose = require("mongoose");

var app = express();

app.io = require("socket.io")();
var clients = {};

function nickname_vaild(nickname) {
  //닉네임중복체크
  var returnCode = 1;
  for (var i in clients) {
    if (clients[i] == nickname) {
      returnCode = -1;
      break;
    }
  }
  return returnCode;
}

mongoose.connect('mongodb://localhost/db', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false});
/*

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGO_DB);

*/

var db = mongoose.connection;

db.on('error', function() {console.error});
db.once('open', function() {console.log('connect successfully')});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/hangul-js'));//한글.js
app.use('/js', express.static(__dirname + '/node_modules/kuroshiro/dist'));//kuroshiro
app.use('/js', express.static(__dirname + '/node_modules/kuroshiro-analyzer-kuromoji/dist'));//kuroshiro
app.use('/jp/dict', express.static(__dirname + '/node_modules/kuromoji/dict'));//kuroshiro
app.use('/jp/dict', express.static(__dirname + '/node_modules'));//kuroshiro

app.use('/css', express.static(__dirname + '/node_modules/normalize.css'));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/anime', animeRouter);
app.use('/country', CountryRouter);
app.use('/producer', ProducerRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
