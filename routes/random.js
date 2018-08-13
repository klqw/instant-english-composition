'use strict';
const express = require('express');
const router = express.Router();
const common = require('./common');
const Sentence = require('../models/sentence');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const course = 'random';
const title = 'ランダム出題コース';
const buttons = [];
common.stageTextConverter(buttons);

router.get('/', csrfProtection, (req, res, next) => {
  Sentence.findAll().then((sentences) => {
    res.render('random', {
      sentences: sentences,
      user: req.user,
      course: course,
      title: title,
      buttons: buttons,
      csrfToken: req.csrfToken()
    });
  });
});

module.exports = router;
