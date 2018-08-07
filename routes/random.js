'use strict';
const express = require('express');
const router = express.Router();
const common = require('./common');
const Sentence = require('../models/sentence');

const flag = 'random';
const title = 'ランダム出題コース';
const buttons = [];
common.pushArray(buttons);

router.get('/', (req, res, next) => {
  Sentence.findAll().then((sentences) => {
    res.render('random', {
      sentences: sentences,
      user: req.user,
      flag: flag,
      title: title,
      buttons: buttons
    });
  });
});

module.exports = router;
