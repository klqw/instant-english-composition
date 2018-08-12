var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var session = require('express-session');
var passport = require('passport');

// モデルの読み込み
var User = require('./models/user');
var Sentence = require('./models/sentence');
var Record = require('./models/record');
var Incorrect = require('./models/incorrect');

User.sync();
Sentence.sync();
Record.sync();
Incorrect.sync();

var GitHubStrategy = require('passport-github2').Strategy;
var GITHUB_CLIENT_ID = 'a44da6821666b14fe60e';
var GITHUB_CLIENT_SECRET = '02e048a5f5534372283a6ee741b3a318e2190132';

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:8000/auth/github/callback'
},
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.upsert({
        userId: profile.id,
        username: profile.username
      }).then(() => {
        done(null, profile);
      });
    });
  }
));

var index = require('./routes/index');
var login = require('./routes/login');
var logout = require('./routes/logout');
var select = require('./routes/select');
var random = require('./routes/random');
var sentences = require('./routes/sentences');
var records = require('./routes/records');

var app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: '11f9d255047163e0', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/login', login);
app.use('/logout', logout);
app.use('/select', select);
app.use('/random', random);
app.use('/sentences', sentences);
app.use('/records', records);

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  function (req, res) {
});

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    var loginFrom = req.cookies.loginFrom;
    // オープンリダイレクタ脆弱性対策
    if (loginFrom &&
      loginFrom.indexOf('http://') < 0 &&
      loginFrom.indexOf('https://') < 0) {
        res.clearCookie('loginFrom');
        res.redirect(loginFrom);
    } else {
      res.redirect('/');
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
