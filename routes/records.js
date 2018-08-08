'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('node-uuid');
const Record = require('../models/record');
const Incorrect = require('../models/incorrect');

router.post('/recording', authenticationEnsurer, (req, res, next) => {
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
        res.json({ status: 'OK', incorrect: incorrect });
      });
    });
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
