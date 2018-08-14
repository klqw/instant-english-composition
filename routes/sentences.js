'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const common = require('./common');
const User = require('../models/user');
const Sentence = require('../models/sentence');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const grades = {
  text1: '中学1年レベル',
  text2: '中学2年レベル',
  text3: '中学3年レベル'
};
const selects = [];
common.stageTextConverter(selects);

router.get('/', authenticationEnsurer, (req, res, next) => {
  const title = '瞬間英作文';
  Sentence.findAll({
    order: [['"sentenceId"', 'ASC']]
  }).then((sentences) => {
    res.render('sentence', {
      title: title,
      sentences: sentences,
      user: req.user,
      grades: grades,
      selects: selects
    });
  });
});

router.get('/new', authenticationEnsurer, csrfProtection, (req, res, next) => {
  res.render('new', {
    user: req.user,
    grades: grades,
    selects: selects,
    csrfToken: req.csrfToken()
  });
});

router.get('/:sentenceId/edit', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Sentence.findOne({
    where: {
      sentenceId: req.params.sentenceId
    }
  }).then((sentence) => {
    if (isMine(req, sentence) || req.user.username === 'klqw') {  // 編集フォームを開けるユーザーであるかどうかの判定
      res.render('edit', {
        user: req.user,
        grades: grades,
        selects: selects,
        sentence: sentence,
        csrfToken: req.csrfToken()
      });
    } else {
      const err = new Error('指定された問題文がない、または、問題文を編集する権限がありません。');
      err.status = 404;
      next(err);
    }
  });
});

router.get('/search', authenticationEnsurer, (req, res, next) => {
  if (!(isNaN(parseInt(req.query.grade))) && !(isNaN(parseInt(req.query.stage)))) {
    const grade = parseInt(req.query.grade);
    const stage = parseInt(req.query.stage);
    let searchStageText = '';
    Sentence.findAll({
      where: {
        grade: grade,
        stage: stage
      }
    }).then((sentences) => {
      if (sentences) {
        selects.forEach((s) => {
          if (grade === s.grade && stage === s.stage) {
            searchStageText = s.text;
          }
        });
      }
      res.render('sentence', {
        user: req.user,
        grades: grades,
        selects: selects,
        sentences: sentences,
        searchStageText: searchStageText
      });
    });
  } else if (!(isNaN(parseInt(req.query.user)))) {
    Sentence.findAll({
      include: [{
        model: User,
        attributes: ['userId', 'username']
        }],
      where: {
        createdBy: parseInt(req.query.user)
      }
    }).then((sentences) => {
      res.render('sentence', {
        user: req.user,
        grades: grades,
        selects: selects,
        sentences: sentences
      });
    });
  } else {
    const err = new Error('不正なリクエストです。');
    err.status = 400;
    next(err);
  }
});

router.post('/one', authenticationEnsurer, csrfProtection, (req, res, next) => {
  const answer = req.body.answer;
  const isChecked = answerCheck(answer);
  if (isChecked) {
    Sentence.create({
      grade: req.body.grade,
      stage: req.body.stage,
      question: req.body.question.trim().slice(0, 255),
      answer: answer.trim().slice(0, 255),
      createdBy: req.user.id
    }).then(() => {
      res.redirect('/sentences');
    });
  } else {
    const err = new Error('英文の形式に誤りがあったため、登録できませんでした。');
    err.status = 400;
    next(err);
  }
});

router.post('/bulk', authenticationEnsurer, csrfProtection, (req, res, next) => {
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
    const err = new Error('入力の形式に誤りがあったため、登録できませんでした。');
    err.status = 400;
    next(err);
  }
});

router.post('/:sentenceId', authenticationEnsurer, csrfProtection, (req, res, next) => {
  Sentence.findOne({
    where: { sentenceId: req.params.sentenceId }
  }).then((sentence) => {
    if (sentence && isMine(req, sentence) || sentence && req.user.username === 'klqw') {
      if (parseInt(req.query.edit) === 1) {
        const answer = req.body.answer;
        const isChecked = answerCheck(answer);
        if (isChecked) {
          sentence.update({
            sentenceId: sentence.sentenceId,
            grade: req.body.grade,
            stage: req.body.stage,
            question: req.body.question.trim().slice(0, 255),
            answer: answer.trim().slice(0, 255)
          }).then(() => {
            res.redirect('/sentences');
          });
        } else {
          const err = new Error('英文の形式に誤りがあったため、編集できませんでした。');
          err.status = 400;
          next(err);
        }
      } else if (parseInt(req.query.delete) === 1) {
        Sentence.findById(sentence.sentenceId).then((s) => { return s.destroy();
        }).then(() => {
          res.redirect('/sentences');
        });
      } else {
        const err = new Error('不正なリクエストです。');
        err.status = 400;
        next(err);
      }
    } else {
      const err = new Error('指定された問題文がない、または、問題文を編集する権限がありません。');
      err.status = 404;
      next(err);
    }
  });
});

function answerCheck(str) {
  let isChecked = (/^[A-Z]/).test(str);
  let tmpReplace = str;

  if (tmpReplace.indexOf('[') >= 0) {
    tmpReplace = tmpReplace.replace(/\[((\w[\'\,\.\?\!]*)+\s+)+\/(\s+(\w[\'\,\.\?\!]*)*)+\]/g, '&&&');
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

function isMine(req, sentence) {
  return sentence && parseInt(sentence.createdBy) === parseInt(req.user.id);
}

module.exports = router;
