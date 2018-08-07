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

router.post('/', authenticationEnsurer, (req, res, next) => {
  const postFlag = parseInt(req.body.posted);
  if (postFlag === 1) {
    const answer = req.body.answer.trim().slice(0, 255);
    const isChecked = answerCheck(answer);
    if (isChecked) {
      Sentence.create({
        grade: parseInt(req.body.grade),
        stage: parseInt(req.body.stage),
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
  } else if (postFlag === 2) {
    if (req.body.bulkpost.indexOf('|') >= 0) {
      const bulkPosts = req.body.bulkpost.trim().split('\n').map((s) => s.trim());
      const sentences = [];
      const userId = parseInt(req.user.id);
      const promise = converter(bulkPosts, sentences, userId);
      Promise.all(promise).then((s) => {
        Sentence.bulkCreate(s).then(() => {
          res.redirect('/sentences');
        });
      });
    } else {
      const err = new Error('入力の形式に不具合があったため、登録できませんでした。');
      err.status = 400;
      next(err);
    }
  } else {
    const err = new Error('不正なリクエストです。');
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
  let element = {}, grade, stage, question, answer;
  rawArray.forEach((e) => {
    tmpElement = e.split('|');
    grade = parseInt(tmpElement[1]);
    stage = parseInt(tmpElement[2]);
    question = tmpElement[3];
    answer = tmpElement[4];
    element = {
      grade: grade,
      stage: stage,
      question: question,
      answer: answer,
      createdBy: createdBy
    };
    convertArray.push(element);
  });

  return convertArray;
}


module.exports = router;
