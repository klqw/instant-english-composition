'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const common = require('./common');
const Sentence = require('../models/sentence');

const grades = {
  text1: '中学1年レベル',
  text2: '中学2年レベル',
  text3: '中学3年レベル'
};
const selects = [];
common.pushArray(selects);

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
  res.render('new', {
    user: req.user,
    grades: grades,
    selects: selects
  });
});

router.post('/one', authenticationEnsurer, (req, res, next) => {
  const answer = req.body.answer.trim().slice(0, 255);
  const isChecked = answerCheck(answer);
  if (isChecked) {
    Sentence.create({
      grade: req.body.grade,
      stage: req.body.stage,
      question: req.body.question.trim().slice(0, 255),
      answer: answer,
      createdBy: req.user.id
    }).then(() => {
      res.redirect('/sentences');
    });
  } else {
    const err = new Error('英文の形式に不具合があったため、登録できませんでした。');
    err.status = 400;
    next(err);
  }
});

router.post('/bulk', authenticationEnsurer, (req, res, next) => {
  if (req.body.bulktext.indexOf('|') >= 0) {
    const bulkTexts = req.body.bulktext.trim().split('\n').map((s) => s.trim());
    const sentences = [];
    const userId = parseInt(req.user.id);
    const promise = converter(bulkTexts, sentences, userId);
    Promise.all(promise).then((sentences) => {
      Sentence.bulkCreate(sentences).then(() => {
        res.redirect('/sentences');
      });
    });
  } else {
    const err = new Error('入力の形式に不具合があったため、登録できませんでした。');
    err.status = 400;
    next(err);
  }
});

function answerCheck(str) {
  let tmpReplace = str;
  let isChecked = (/^[A-Z]/).test(str);

  if (tmpReplace.indexOf('[') >= 0) {
    tmpReplace = tmpReplace.replace(/\[((\w(\'|\,|\.|\?|\!)*)+\s+)+\/(\s+(\w(\'|\,|\.|\?|\!)*)*)+\]/g, '&&&');
  }
  if (tmpReplace.indexOf('[') >= 0) {
    isChecked = false;
  }

  return isChecked;
}

function converter(rawArray, convertArray, createdBy) {
  let tmpElement;
  rawArray.forEach((e) => {
    tmpElement = e.split('|');
    convertArray.push({
      grade: parseInt(tmpElement[0]),
      stage: parseInt(tmpElement[1]),
      question: tmpElement[2],
      answer: tmpElement[3],
      createdBy: createdBy
    });
  });
  return convertArray;
}

module.exports = router;
