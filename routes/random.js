'use strict';
const express = require('express');
const router = express.Router();
const commons = require('./commons');

const flag = 'random';
const title = 'ランダム出題コース';
const buttons = [];
commons.pushArray(buttons);

router.get('/', (req, res, next) => {
  res.render('random', {
    user: req.user,
    flag: flag,
    title: title,
    buttons: buttons
  });
});

module.exports = router;
