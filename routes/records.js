'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('node-uuid');
const common = require('./common');
const Record = require('../models/record');
const Incorrect = require('../models/incorrect');

router.post('/', authenticationEnsurer, (req, res, next) => {
  const recordId = uuid.v4();
  const recordedAt = new Date();
  Record.create({
    recordId: recordId,
    course: req.body.course,
    grade: parseInt(req.body.grade),
    stage: parseInt(req.body.stage),
    correct: parseInt(req.body.correct),
    incorrect: parseInt(req.body.incorrect),
    recordedBy: parseInt(req.body.recordedBy),
    recordedAt: recordedAt
  }).then((record) => {
    const incorrectTexts = req.body.incorrectText.split('|||'); // grade&&&stage&&&question&&&yourAnswer&&&correctAnswer|||
    incorrectTexts.pop();
    const incorrect = [];
    const recordId = record.recordId;
    const promise = converter(incorrectTexts, incorrect, recordId);
    Promise.all(promise).then((incorrect) => {
      Incorrect.bulkCreate(incorrect).then(() => {
        res.json({ status: 'OK', record: record, incorrect: incorrect });
      });
    });
  });
});

router.get('/', authenticationEnsurer, (req, res, next) => {
  const title = '瞬間英作文';
  const stageTexts = [];
  common.stageTextConverter(stageTexts);
  if (req.user) {
    Record.findAll({
      where: {
        recordedBy: req.user.id
      },
      order: [['"recordedAt"', 'DESC']]
    }).then((records) => {
      records.forEach((record) => {
        stageTexts.forEach((stageText) => {
          if (record.course === 'select') {
            if (record.grade === stageText.grade && record.stage === stageText.stage) {
              record.courseText = '問題選択コース';
              record.stageText = stageText.text;
            }
          } else {
            if (record.stage === stageText.stage) {
              record.courseText = 'ランダム出題コース';
              record.stageText = stageText.text;
            }
          }
        });
      });
      res.render('record', {
        title: title,
        user: req.user,
        records: records
      });
    });
  } else {
    res.render('record', { title: title, user: req.user });
  }
});

router.get('/:recordId', authenticationEnsurer, (req, res, next) => {
  const stageTexts = [];
  common.stageTextConverter(stageTexts);
  Record.findOne({
    where: {
      recordId: req.params.recordId
    }
  }).then((record) => {
    if (record) {
      Incorrect.findAll({
        where: { recordId: record.recordId },
        order: [['"incorrectId"', 'ASC']]
      }).then((incorrectAll) => {
        record.count = record.correct + record.incorrect;
        record.correctRate = Math.floor((record.correct / record.count) * 100);
        stageTexts.forEach((stageText) => {
          if (record.course === 'select') {
            if (record.grade === stageText.grade && record.stage === stageText.stage) {
              record.courseText = '問題選択コース';
              record.stageText = stageText.text;
            }
          } else {
            if (record.stage === stageText.stage) {
              record.courseText = 'ランダム出題コース';
              record.stageText = stageText.text;
            }
          }
        });
        incorrectAll.forEach((incorrect) => {
          stageTexts.forEach((stageText) => {
            if (incorrect.grade === stageText.grade && incorrect.stage === stageText.stage) {
              incorrect.stageText = stageText.text;
            }
          });
        });
        res.render('detail', {
          user: req.user,
          record: record,
          incorrectAll: incorrectAll
        });
      });
    } else {
      const err = new Error('指定された記録は見つかりませんでした。');
      err.status = 404;
      next(err);
    }
  });
});

function converter(rawArray, convertArray, recordId) {
  let tmpElement;
  rawArray.forEach((e) => {
    tmpElement = e.split('&&&');
    convertArray.push({
      recordId: recordId,
      grade: parseInt(tmpElement[0]),
      stage: parseInt(tmpElement[1]),
      question: tmpElement[2].replace(/\(tmp\)/g, ' '),
      yourAnswer: tmpElement[3].replace(/\(tmp\)/g, ' '),
      correctAnswer: tmpElement[4].replace(/\(tmp\)/g, ' ')
    });
  });
  return convertArray;
}

module.exports = router;
