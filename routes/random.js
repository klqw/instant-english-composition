'use strict';
const express = require('express');
const router = express.Router();
const commons = require('./commons');
const Sentence = require('../models/sentence');

const flag = 'random';
const title = 'ランダム出題コース';
const buttons = [];
commons.pushArray(buttons);

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
