'use strict';
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  const title = '瞬間英作文';
  res.render('index', { title: title, user: req.user });
});

module.exports = router;
