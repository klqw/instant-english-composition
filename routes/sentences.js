'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Sentence = require('../models/sentence');

router.get('/', authenticationEnsurer, (req, res, next) => {
  const title = '瞬間英作文';
  Sentence.findAll().then((sentences) => {
    res.render('sentence', {
      title: title,
      sentences: sentences,
      user: req.user
    });
  });
});

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  Sentence.create({
    grade: parseInt(req.body.grade),
    stage: parseInt(req.body.stage),
    question: req.body.question,
    answer: req.body.answer,
    createdBy: req.user.id
  }).then(() => {
    res.redirect('/sentences');
  });
});

module.exports = router;
