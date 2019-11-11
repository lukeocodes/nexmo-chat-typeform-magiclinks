var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
var User = require('./models/user');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var webhookRouter = require('./routes/webhook');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());

app.use(session({ 
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true
}));

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

var jwtStrategy = require('passport-jwt').Strategy;
var jwtExtractor = require('passport-jwt').ExtractJwt;

var opts = { 
  jwtFromRequest: jwtExtractor.fromUrlQueryParameter('token'),
  secretOrKey: process.env.SECRET
};

passport.use(new jwtStrategy(opts, (payload, done) => {
  return done(null, payload);
}))

app.use('/', indexRouter);
app.use('/auth', passport.authenticate('jwt', { session: true }), authRouter);
app.use('/webhooks', webhookRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
