'use strict';
import $ from 'jquery';
const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';

const sentences = $('#sentences').data('sentences');
const userId = $('#userid').data('userid') || '';
const course = $('#course').data('course');
const countDownTime = 3;
let storedGradeAndStage;
let storedCorrectAndIncorrect;
let setSentences;
let incorrectSentences;
let incorrectText;
let isClicked, isStarted, isCheated, isRetried, isRecorded;
let count, finishCount;

$('#tabs li').click(function() {  // タブの処理
  let index = $('#tabs li').index(this);

  $('.content-wrap').addClass('disp-none');
  $('.content-wrap').eq(index).removeClass('disp-none');

  $('#tabs li').removeClass('select');
  $(this).addClass('select');
});

$('.open').each((i, e) => { // 問題文をセットしてモーダルウィンドウを開く
  const button = $(e);
  button.click(() => {
    const grade = parseInt(button.data('grade'));
    const stage = parseInt(button.data('stage'));
    const title = $('#course').data('title');
    const buttonText = button.text();
    $('#title-text').html(`${title} - ${buttonText}`);
    initialize();
    storedGradeAndStage = setStage(grade, stage);
    $('#overlay, #modal-contents').fadeIn();
  });
});

$('#close, #stage-select-button').click(() => {
  $('#overlay, #modal-contents').fadeOut();
});

$('#question-display').click(() => {
  if (isClicked) {
    $('#close').addClass('hidden');
    $('#answer-text').focus();
    isClicked = false;
    count = 0;
    countDown(countDownTime);
  }
});

$('#answer-text').keypress((e) => {
  if (isStarted && e.which === 13) {
    isStarted = false;
    judgement($('#answer-text').val(), setSentences[count].answer);
  }
});

$('#answer-button').click(() => {
  if (isStarted) {
    isStarted = false;
    $('#answer-text').focus();
    judgement($('#answer-text').val(), setSentences[count].answer);
  }
});

$('#cheat-button').click(() => {
  if (!isCheated) {
    isCheated = true;
    const answerExample = wordChoice(setSentences[count].answer);
    const escapedAnswerExample = escapeHtml(answerExample[0]);
    $('#answer-text').focus();
    $('#cheat-display').html(`解答例はこちら<br>${escapedAnswerExample}`);
  }
});

$('#record-button').click(() => { // 結果を記録する
  if (isRecorded) {
    isRecorded = false;
    const _csrf = $('#csrf').val();
    $.post('/records', {
      course: course,
      grade: storedGradeAndStage[0],
      stage: storedGradeAndStage[1],
      correct: storedCorrectAndIncorrect[0],
      incorrect: storedCorrectAndIncorrect[1],
      recordedBy: userId,
      incorrectText: incorrectText,
      _csrf: _csrf
    }, (data) => {
      alert('今回の結果を記録しました。');
    });
  } else {
    alert('今回の結果はすでに記録しています。');
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

$('#index-button').click(() => {
  window.location.href = '/';
});

$('#done').click(() => {
  $('#incorrect-display-zone').addClass('hidden');
  $('#result-zone').removeClass('hidden');
});

function initialize() {
  $('#close').removeClass('hidden');
  $('#stage-zone').removeClass('hidden');
  $('#judge-zone').addClass('hidden');
  $('#cheat-zone').addClass('hidden');
  $('#result-zone').addClass('hidden');
  $('#incorrect-display-zone').addClass('hidden');
  $('#question-display').html('ここをクリックすると問題が出ます。');
  $('#question-display').addClass('non-started');
  $('#answer-text').val('');
  $('#judge-display').html('');
  $('#cheat-display').html('');
  $('#result-display').html('');
  $('#incorrect-display').html('');
  setSentences = [];
  incorrectSentences = [];
  incorrectText = '';
  isClicked = true;
  isStarted = false;
  isCheated = false;
  isRetried = false;
  isRecorded = false;
  count = 0;
  finishCount = (course === 'select') ? 10 : parseInt($('#random-num').val());
}

function setStage(grade, stage) {
  const gradeAndStage = [grade, stage];
  if (course === 'select') {
    sentences.forEach((e) => {
      if (grade === e.grade && stage === e.stage) {
        setSentences.push({
          grade: e.grade,
          stage: e.stage,
          question: e.question,
          answer: e.answer
        });
      }
    });
  } else {
    if (grade === 99) {
      sentences.forEach((e) => {
        setSentences.push({
          grade: e.grade,
          stage: e.stage,
          question: e.question,
          answer: e.answer
        });
      });
    } else {
      setRandomCourse(grade);
    }
  }
  shuffle(setSentences);
  return gradeAndStage;
}

function setRandomCourse(grade) {
  sentences.forEach((e) => {
    if (grade === e.grade) {
      setSentences.push({
        grade: e.grade,
        stage: e.stage,
        question: e.question,
        answer: e.answer
      });
    }
  });
}

function countDown(countDownTime) {
  if (setSentences.length < finishCount) {
    $('#question-display').removeClass('non-started');
    $('#question-display').html('準備中です。');
    $('#close').removeClass('hidden');
    return;
  }
  $('#question-display').html(countDownTime--);
  let timerId = setTimeout(() => {
    countDown(countDownTime);
  }, 1000);
  if (countDownTime < 0) {
    clearTimeout(timerId);
    $('#question-display').removeClass('non-started');
    $('#question-display').html(escapeHtml(setSentences[count].question).replace(/　/g, '<br>'));
    $('#close').removeClass('hidden');
    $('#cheat-zone').removeClass('hidden');
    isStarted = true;
  }
}

function shuffle(array) {
  if (array.length <= 1) {
    return;
  }
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
  let judgementAnswer = ''; // 解が複数ある場合の判定に使う変数

  if (isCheated) {  // カンニングボタンを押したときの処理
    cheatDisp(textRaw, answerRaw);
  } else if (answerReplace.indexOf('[') >= 0) { // 使用できる単語が複数ある場合の処理
    const answersCandidates = wordChoice(answerReplace);
    let correctFlag = false;
    for (let i = 0; i < answersCandidates.length; i++) {
      judgementAnswer = replacer(answersCandidates[i]); // 判定時のエラーを防ぐために再度replacer関数を通す
      if (textReplace === judgementAnswer) {
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
  judgeDispProcess('正解です！', 'correct');
  setTimeout(() => {
    nextQuestion();
  }, 1500);
}

function incorrectDisp(textRaw, answerRaw) {
  const escapedText = escapeHtml(textRaw);
  const answerExample = wordChoice(answerRaw);
  const escapedAnswerExample = escapeHtml(answerExample[0]);
  const incorrectText = '不正解です！<br>' +
                        `<span style="color: orange">あなたの解答</span><br>${escapedText}<br>` +
                        `<span style="color: orange">解答例はこちら</span><br>${escapedAnswerExample}`;
  judgeDispProcess(incorrectText, 'incorrect');
  incorrectSentences.push({
    grade: setSentences[count].grade,
    stage: setSentences[count].stage,
    question: escapeHtml(setSentences[count].question),
    yourAnswer: escapedText,
    answerRaw: answerRaw,
    answerExample: escapedAnswerExample
  });
  setTimeout(() => {
    nextQuestion();
  }, 8000);
}

function cheatDisp(textRaw, answerRaw) {
  const answerExample = wordChoice(answerRaw);
  judgeDispProcess('次の問題に行きましょう！', 'cheat');
  incorrectSentences.push({
    grade: setSentences[count].grade,
    stage: setSentences[count].stage,
    question: escapeHtml(setSentences[count].question),
    yourAnswer: escapeHtml(textRaw) + ' (カンニング)',
    answerRaw: answerRaw,
    answerExample: escapeHtml(answerExample[0])
  });
  setTimeout(() => {
    isCheated = false;
    nextQuestion();
  }, 1000);
}

function judgeDispProcess(text, className) {
  $('#judge-display').removeClass('correct incorrect cheat');
  $('#judge-display').addClass(className);
  $('#cheat-zone').addClass('hidden');
  $('#cheat-display').html('');
  $('#judge-zone').removeClass('hidden');
  $('#judge-display').html(text);
}

function nextQuestion() {
  count++;
  if (count < finishCount) {
    $('#question-display').html(escapeHtml(setSentences[count].question).replace(/　/g, '<br>'));
    $('#answer-text').val('');
    $('#answer-text').focus();
    isStarted = true;
    $('#judge-zone').addClass('hidden');
    $('#judge-display').html('');
    $('#cheat-zone').removeClass('hidden');
  } else {
    finish();
  }
}

function finish() {
  $('#stage-zone').addClass('hidden');
  $('#result-zone').removeClass('hidden');
  $('#judge-display').html('');
  isCheated = true;
  const incorrectCount = incorrectSentences.length;
  if (!isRetried) {
    storedCorrectAndIncorrect = [finishCount - incorrectCount, incorrectCount];
    incorrectSentences.forEach((e) => {
      incorrectText += `${e.grade}&&&${e.stage}&&&${e.question}&&&` +
                       `${e.yourAnswer}&&&${e.answerExample}|||`;
    });
    isRecorded = true;
  }
  if (incorrectCount === 0) {
    isRetried = false;
    const resultText = '<span style="color: red">全問正解！</span><br>' +
                       `${count}問中: 正解: ${count}問 不正解: 0問<br>` +
                       '正解率は <span style="color: red">100％</span> でした！';
    $('#result-display').html(resultText);
    $('#incorrect-display').html('あなたは全問正解しました。');
  }
  else {
    isRetried = true;
    const correctCount = count - incorrectCount;
    const correctRate = Math.floor((correctCount / count) * 100);
    const resultText = `${count}問中: 正解: ${correctCount}問 不正解: ${incorrectCount}問<br>` +
                       `正解率は <span style="color: blue">${correctRate}％</span> でした！`;
    $('#result-display').html(resultText);
    let storedText = '<h3>間違えた問題一覧</h3><hr>';
    for (let i = 0; i < incorrectSentences.length; i++) {
      storedText += '<table><tr><td><span style="color: orange">問題文</span></td>' +
                  `<td>${incorrectSentences[i].question}</td></tr>` +
                  '<tr><td><span style="color: orange">あなたの解答　</span></td>' +
                  `<td>${incorrectSentences[i].yourAnswer}</td></tr>` +
                  '<tr><td><span style="color: orange">解答例</span></td>' +
                  `<td>${incorrectSentences[i].answerExample}</td></tr></table><hr>`;
    }
    $('#incorrect-display').html(storedText);
  }
  isStarted = false;
}

function incorrectRetry() {
  $('#result-zone').addClass('hidden');
  $('#stage-zone').removeClass('hidden');
  $('#answer-text').val('');
  $('#answer-text').focus();
  $('#judge-zone').addClass('hidden');
  $('#cheat-zone').removeClass('hidden');
  setSentences = [];
  incorrectSentences.forEach((e) => {
    setSentences.push({
      grade: e.grade,
      stage: e.stage,
      question: e.question,
      answer: e.answerRaw
    });
  });
  incorrectSentences = [];
  count = 0;
  finishCount = setSentences.length;
  $('#question-display').html(setSentences[count].question.replace(/　/g, '<br>'));
  isStarted = true;
  isCheated = false;
}

function escapeHtml(str) {  // XSS対策
  const escapes = {
    '&': '&amp;',
    '|': '&#124;',
    "'": '&apos;',
    '`': '&#096;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;'
  };
  let escapeRegex = '[';
  for (let escape in escapes) {
    if (escapes.hasOwnProperty(escape)) {
      escapeRegex += escape;
    }
  }
  escapeRegex += ']';
  const regex = new RegExp(escapeRegex, 'g');
  str = (str) ? str : ' ';
  return str.replace(regex, (match) => {
    return escapes[match];
  });
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
  str = str.replace(/wasn\'t/g, 'was not');
  str = str.replace(/Wasn\'t/g, 'Was not');
  str = str.replace(/weren\'t/g, 'were not');
  str = str.replace(/Weren\'t/g, 'Were not');
  str = str.replace(/don\'t/g, 'do not');
  str = str.replace(/Don\'t/g, 'Do not');
  str = str.replace(/doesn\'t/g, 'does not');
  str = str.replace(/Doesn\'t/g, 'Does not');
  str = str.replace(/didn\'t/g, 'did not');
  str = str.replace(/Didn\'t/g, 'Did not');
  str = str.replace(/can\'t/g, 'cannot');
  str = str.replace(/Can\'t/g, 'Cannot');
  str = str.replace(/couldn\'t/g, 'could not');
  str = str.replace(/Couldn\'t/g, 'Could not');
  str = str.replace(/won\'t/g, 'will not');
  str = str.replace(/Won\'t/g, 'Will not');
  str = str.replace(/mustn\'t/g, 'must not');
  str = str.replace(/Mustn\'t/g, 'Must not');
  str = str.replace(/haven\'t/g, 'have not');
  str = str.replace(/Haven\'t/g, 'Have not');
  str = str.replace(/hasn\'t/g, 'has not');
  str = str.replace(/Hasn\'t/g, 'Has not');
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
  str = str.replace(/\'ll/g, ' will');
  str = str.replace(/\'d/g, ' would');
  str = str.replace(/\'ve/g, ' have');
  str = str.replace(/let\'s/g, 'let us');
  str = str.replace(/Let\'s/g, 'Let us');
  return str;
}

function wordChoice(str) {
  let tmpReplace = str;
  let candidatesWords = [];
  let matchCount = 0, loopCount = 0;
  let frontWord, backWord;
  let badSentence = false;

  while (true) {
    if (tmpReplace.indexOf('[') >= 0) {
      frontWord = tmpReplace.slice(tmpReplace.indexOf('[') + 1, tmpReplace.indexOf('/')).trim();
      backWord = tmpReplace.slice(tmpReplace.indexOf('/') + 1, tmpReplace.indexOf(']')).trim();
      tmpReplace = tmpReplace.replace(/\[((\w[',!\-\.\?]*)+\s+)+\/(\s+(\w[',!\-\.\?]*)*)+\]/, '&&&');
      candidatesWords[matchCount] = [frontWord, backWord];
      matchCount++;
    } else {
      break;
    }
    if (loopCount > 1000) {
      badSentence = true;
      break;
    }
    loopCount++;
  }

  const candidateCount = Math.pow(2, matchCount);
  let binary = '';
  let sliceBinaries = [];
  let tmpChoice = tmpReplace;
  let candidatesSentences = [];

  if (badSentence) {
    str = '英文の変換処理を失敗しました。';
    candidatesSentences = [str, str];
    return candidatesSentences;
  } else {
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
