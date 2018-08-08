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
    const incorrectTexts = req.body.incorrectText.split('|'); // grade&stage&question&yourAnswer&correctAnswer|
    const consoleText = req.body.incorrectTexts;
    console.log(consoleText);
    const incorrect = [];
    const recordId = record.recordId;
    let tmpElement = [];
    let element = {}, grade, stage, question, yourAnswer, correctAnswer;
    incorrectTexts.forEach((e) => {
      tmpElement = e.split('&');
      element = {
        recordId: recordId,
        grade: parseInt(tmpElement[0]),
        stage: parseInt(tmpElement[1]),
        question: tmpElement[2],
        yourAnswer: tmpElement[3],
        correctAnswer: tmpElement[4]
      }
      incorrect.push(element);
    });
    Incorrect.bulkCreate(incorrect).then(() => {
      res.json({ status: 'OK', incorrect: incorrect });
    });
  });
});

module.exports = router;
