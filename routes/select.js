'use strict';
const express = require('express');
const router = express.Router();
const common = require('./common');
const Sentence = require('../models/sentence');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const course = 'select';
const title = '問題選択コース';
const tabs = {
  text1: '中学1年レベル',
  text2: '中学2年レベル',
  text3: '中学3年レベル'
};
const buttons = [];
common.stageTextConverter(buttons);

router.get('/', csrfProtection, (req, res, next) => {
  Sentence.findAll().then((sentences) => {
    res.render('select', {
      sentences: sentences,
      user: req.user,
      course: course,
      title: title,
      tabs: tabs,
      buttons: buttons,
      csrfToken: req.csrfToken()
    });
  });
});

module.exports = router;
