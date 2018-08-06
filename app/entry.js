'use strict';
import $ from 'jquery';

const questionDisplay = document.getElementById('question-display');
const answerText = document.getElementById('answer-text');
const judgeDisplay = document.getElementById('judge-display');
const flag = $('#course-flag').val();
const sentences = $('#sentences').data('sentences');
let storedGradeAndStage = [];
let questionsArray = [];
let answersArray = [];
let incorrectSentences = [];
let isClicked, isStarted, isCheated, isRetried;
let count, finishCount;
const countDownTime = 3;

$('.tab li').click(function() {  // タブの処理
  let index = $('.tab li').index(this);

  $('.content-wrap').addClass('disp-none');
  $('.content-wrap').eq(index).removeClass('disp-none');

  $('.tab li').removeClass('select');
  $(this).addClass('select');
});

$('.open').each((i, e) => { // 問題文をセットしてモーダルウィンドウを開く
  const button = $(e);
  button.click(() => {
    const grade = button.data('grade');
    const stage = button.data('stage');
    initialize();
    storedGradeAndStage = setStage(grade, stage);
    $('#overlay, #modal-contents').fadeIn();
  });
});

$('#close, #stage-select-button').click(() => {
  $('#overlay, #modal-contents').fadeOut();
});

locateCenter();
$(window).resize(locateCenter);

function locateCenter() { // モーダルウィンドウを中央配置するための関数
  let w = $(window).width();
  let h = $(window).height();
  let cw = $('#modal-contents').outerWidth();
  let ch = $('#modal-contents').outerHeight();
  $('#modal-contents').css({
    'left': ((w - cw) / 2) + 'px',
    'top': ((h - ch) / 2) + 'px'
  });
}

$(questionDisplay).click(() => {
  if (isClicked) {
    answerText.focus();
    isClicked = false;
    count = 0;
    countDown(countDownTime);
  }
});

$(answerText).keypress((e) => {
  if (isStarted && e.which === 13) {
    isStarted = false;
    judgement(answerText.value, answersArray[count]);
  }
});

$('#cheat-button').click(() => {
  answerText.focus();
  if (!isCheated) {
    isCheated = true;
    $('#cheat-display').removeClass('hidden');
    const answerReplace = replacer(answersArray[count]);
    const answerExample = wordChoice(answerReplace);
    const exampleNum = Math.floor(Math.random() * answerExample.length);
    $('#cheat-display').html(`解答例はこちら:<br>${answerExample[exampleNum]}`);
  }
});

$('#retry-button').click(() => {
  initialize();
  setStage(storedGradeAndStage[0], storedGradeAndStage[1]);
  $('#result-zone').addClass('hidden');
  $('#stage-zone').removeClass('hidden');
});

$('#incorrect-retry-button').click(() => {
  if (isRetried) {
    incorrectRetry();
  } else {
    alert('あなたは全問正解しました。');
  }
});

$('#incorrect-check-button').click(() => {
  $('#result-zone').addClass('hidden');
  $('#incorrect-display-zone').removeClass('hidden');
});

$('#done').click(() => {
  $('#incorrect-display-zone').addClass('hidden');
  $('#result-zone').removeClass('hidden');
});

function initialize() {
  $('#stage-zone').removeClass('hidden');
  $('#result-zone').addClass('hidden');
  $('#incorrect-display-zone').addClass('hidden');
  questionDisplay.innerText = 'ここをクリックすると問題が出ます。';
  questionDisplay.className = 'not-started';
  answerText.value = '';
  $('#judge-zone').addClass('hidden');
  $('#judge-display').html('');
  $('#cheat-button').addClass('hidden');
  $('#cheat-display').html('');
  $('#cheat-display').addClass('hidden');
  $('#incorrect-display').html('');
  questionsArray = [];
  answersArray = [];
  incorrectSentences = [];
  isClicked = true;
  isStarted = false;
  isCheated = false;
  isRetried = false;
  count = 0;
  finishCount = (flag === 'select') ? 10 : parseInt($('#random-num').val());
}

function setStage(grade, stage) {
  const gradeNum = parseInt(grade);
  const stageNum = parseInt(stage);
  const gradeAndStage = [gradeNum, stageNum];
  if (flag === 'select') {
    let tmpQuestion, tmpAnswer;
    let num = 0;
    // shuffle(sentencesArray);
    for (let i = 0; i < sentences.length; i++) {
      if (grade === sentences[i].grade && stage === sentences[i].stage) {
        tmpQuestion = sentences[i].question;
        tmpAnswer = sentences[i].answer;
        questionsArray[num] = tmpQuestion;
        answersArray[num] = tmpAnswer;
        num++;
      }
    }
  } else {
    shuffle(sentences);
    questionsArray = sentences.map((value) => value.question);
    answersArray = sentences.map((value) => value.answer);
  }
  return gradeAndStage;
}

function countDown(countDownTime) {
  questionDisplay.innerText = countDownTime--;
  let timerId = setTimeout(() => {
    countDown(countDownTime);
  }, 1000);
  if (countDownTime < 0) {
    clearTimeout(timerId);
    questionDisplay.className = 'started';
    questionDisplay.innerHTML = questionsArray[count];
    $('#cheat-button').removeClass('hidden');
    isStarted = true;
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
}

function judgement(textRaw, answerRaw) {
  const textReplace = replacer(textRaw);
  const answerReplace = replacer(answerRaw);

  if (isCheated) {  // カンニングボタンを押したときの処理
    cheatDisp(textRaw, answerRaw);
  } else if (answerReplace.indexOf('[') >= 0) { // 使用できる単語が複数ある場合の処理
    const answersCandidates = wordChoice(answerReplace);
    let correctFlag = false;
    for (let i = 0; i < answersCandidates.length; i++) {
      if (textReplace === answersCandidates[i]) {
        correctFlag = true;
        break;
      }
    }
    correctFlag ? correctDisp() : incorrectDisp(textRaw, answerRaw);
  } else {
    if (textReplace === answerReplace) {
      correctDisp();
    } else {
      incorrectDisp(textRaw, answerRaw);
    }
  }
}

function correctDisp() {
  judgeDispProcess('正解！', 'correct');
  setTimeout(() => {
    nextQuestion(questionsArray);
  }, 1000);
}

function incorrectDisp(textRaw, answerRaw) {
  const answerExample = wordChoice(answerRaw);
  const exampleNum = Math.floor(Math.random() * answerExample.length);
  const incorrectText = `不正解！<br><span style="color: orange">あなたの解答:</span><br>${textRaw}<br><span style="color: orange">解答例はこちら:</span><br>${answerExample[exampleNum]}`;
  judgeDispProcess(incorrectText, 'incorrect');
  incorrectSentences.push({
    question: questionsArray[count].replace(/\<br\>/, '　'),
    yourAnswer: textRaw,
    answerRaw: answerRaw,
    answerExample: answerExample[exampleNum]
  });
  setTimeout(() => {
    nextQuestion(questionsArray);
  }, 1000);
}

function cheatDisp(textRaw, answerRaw) {
  const answerExample = wordChoice(answerRaw);
  const exampleNum = Math.floor(Math.random() * answerExample.length);
  judgeDispProcess('次の問題に行きましょう！', 'cheat');
  incorrectSentences.push({
    question: questionsArray[count].replace(/\<br\>/, '　'),
    yourAnswer: textRaw,
    answerRaw: answerRaw,
    answerExample: answerExample[exampleNum]
  });
  setTimeout(() => {
    isCheated = false;
    nextQuestion(questionsArray);
  }, 1000);
}

function judgeDispProcess(text, className) {
  judgeDisplay.className = className;
  $('#cheat-button').addClass('hidden');
  $('#cheat-display').addClass('hidden');
  $('#judge-zone').removeClass('hidden');
  $('#judge-display').html(text);
}

function nextQuestion(array) {
  count++;
  if (count < finishCount) {
    questionDisplay.innerHTML = array[count];
    answerText.value = '';
    answerText.focus();
    isStarted = true;
    $('#judge-zone').addClass('hidden');
    $('#judge-display').html('');
    $('#cheat-button').removeClass('hidden');
  } else {
    finish();
  }
}

function finish() {
  $('#stage-zone').addClass('hidden');
  $('#result-zone').removeClass('hidden');
  const incorrectCount = incorrectSentences.length;
  if (incorrectCount === 0) {
    isRetried = false;
    $('#result-display').html(`全問正解！<br>${count}問中: 正解: ${count}問 不正解: 0問<br>正解率は100％でした！`);
    $('#incorrect-display').html('あなたは全問正解しました。');
  }
  else {
    isRetried = true;
    const correctCount = count - incorrectCount;
    const correctAvg = Math.floor((correctCount / count) * 100);
    $('#result-display').html(`${count}問中: 正解: ${correctCount}問 不正解: ${incorrectCount}問<br>正解率は${correctAvg}％でした！`);
    let storedText = '<h3>間違えた問題一覧</h3>';
    for (let i = 0; i < incorrectSentences.length; i++) {
      storedText += `<p>問題文: ${incorrectSentences[i].question}<br>
                  あなたの解答: ${incorrectSentences[i].yourAnswer}<br>
                  解答例はこちら: ${incorrectSentences[i].answerExample}</p>`
    }
    $('#incorrect-display').html(storedText);
  }
  isClicked = true;
  isStarted = false;
}

function incorrectRetry() {
  $('#result-zone').addClass('hidden');
  $('#stage-zone').removeClass('hidden');
  answerText.value = '';
  answerText.focus();
  $('#judge-zone').addClass('hidden');
  $('#cheat-button').removeClass('hidden');
  $('#cheat-display').html('');
  questionsArray = [];
  answersArray = [];
  incorrectSentences.forEach((value) => {
    questionsArray.push(value.question);
    answersArray.push(value.answerRaw);
  });
  incorrectSentences = [];
  count = 0;
  finishCount = questionsArray.length;
  questionDisplay.className = 'started';
  questionDisplay.innerHTML = questionsArray[count];
  isStarted = true;
}

function replacer(str) {
  str = str.trim();
  str = str.replace(/\,/g, ', ');
  str = str.replace(/\./g, '. ');
  str = str.replace(/\?/g, '? ');
  str = str.replace(/\!/g, '! ');
  str = str.replace(/\s{2,}/g, ' ');
  str = str.replace(/aren\'t/g, 'are not');
  str = str.replace(/Aren\'t/g, 'Are not');
  str = str.replace(/isn\'t/g, 'is not');
  str = str.replace(/Isn\'t/g, 'Is not');
  str = str.replace(/don\'t/g, 'do not');
  str = str.replace(/Don\'t/g, 'Do not');
  str = str.replace(/doesn\'t/g, 'does not');
  str = str.replace(/Doesn\'t/g, 'Does not');
  str = str.replace(/didn\'t/g, 'did not');
  str = str.replace(/Didn\'t/g, 'Did not');
  str = str.replace(/can\'t/g, 'cannot');
  str = str.replace(/Can\'t/g, 'Cannot');
  str = str.replace(/won\'t/g, 'will not');
  str = str.replace(/Won\'t/g, 'Will not');
  str = str.replace(/I\'m/g, 'I am');
  str = str.replace(/he\'s/g, 'he is');
  str = str.replace(/He\'s/g, 'He is');
  str = str.replace(/she\'s/g, 'she is');
  str = str.replace(/She\'s/g, 'She is');
  str = str.replace(/it\'s/g, 'it is');
  str = str.replace(/It\'s/g, 'It is');
  str = str.replace(/that\'s/g, 'that is');
  str = str.replace(/That\'s/g, 'That is');
  str = str.replace(/what\'s/g, 'what is');
  str = str.replace(/What\'s/g, 'What is');
  str = str.replace(/I\'ll/g, 'I will');
  str = str.replace(/you\'ll/g, 'you will');
  str = str.replace(/You\'ll/g, 'You will');
  str = str.replace(/let\'s/g, 'let us');
  str = str.replace(/Let\'s/g, 'Let us');
  return str;
}

function wordChoice(str) {
  let tmpReplace = str;
  let candidatesWords = [];
  let matchCount = 0;
  let frontWord, backWord;

  while (true) {
    if (tmpReplace.indexOf('[') >= 0) {
      frontWord = tmpReplace.slice(tmpReplace.indexOf('[') + 1, tmpReplace.indexOf('/')).trim();
      backWord = tmpReplace.slice(tmpReplace.indexOf('/') + 1, tmpReplace.indexOf(']')).trim();
      tmpReplace = tmpReplace.replace(/\[((\w(\'|\,|\.|\?|\!)*)+\s+)+\/(\s+(\w(\'|\,|\.|\?|\!)*)*)+\]/, '&&&');
      candidatesWords[matchCount] = [frontWord, backWord];
      matchCount++;
    } else {
      break;
    }
  }

  const candidateCount = Math.pow(2, matchCount);
  let binary = '';
  let sliceBinaries = [];
  let tmpChoice = tmpReplace;
  let candidatesSentences = [];

  for (let i = 0; i < candidateCount; i++) {
    binary = dumpBinary(i, matchCount);
    for (let j = 0; j < matchCount; j++) {
      sliceBinaries[j] = parseInt(binary.slice(j, j + 1));
      tmpChoice = tmpChoice.replace(/\&{3}/, candidatesWords[j][sliceBinaries[j]]);
      tmpChoice = tmpChoice.replace(/\s{2,}/, ' ');
    }
    candidatesSentences[i] = tmpChoice;
    tmpChoice = tmpReplace;
  }

  return candidatesSentences;
}

function dumpBinary(num, digit) {
  let strBinary = '';
  let digitBinary = Math.pow(2, digit) - 1;
  while (digitBinary) {
    strBinary = (num & 1) + strBinary;
    num >>>= 1;
    digitBinary >>>= 1;
  }
  return strBinary;
}
