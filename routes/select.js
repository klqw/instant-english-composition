'use strict';
const express = require('express');
const router = express.Router();
const commons = require('./commons');
const Sentence = require('../models/sentence');

const flag = 'select';
const title = '問題選択コース';
const tabs = {
  text1: '中学1年レベル',
  text2: '中学2年レベル',
  text3: '中学3年レベル'
};
const buttons = [];
commons.pushArray(buttons);

router.get('/', (req, res, next) => {
  Sentence.findAll().then((sentences) => {
    res.render('select', {
      sentences: sentences,
      user: req.user,
      flag: flag,
      title: title,
      tabs: tabs,
      buttons: buttons
    });
  });
});

module.exports = router;
