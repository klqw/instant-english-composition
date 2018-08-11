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
    const exampleNum = Math.floor(Math.random() * answerExample.length);
    $('#answer-text').focus();
    $('#cheat-display').html(`解答例はこちら<br>${answerExample[exampleNum]}`);
  }
});

$('#record-button').click(() => {
  if (isRecorded) {
    isRecorded = false;
    $.post('/records', {
      course: course,
      grade: storedGradeAndStage[0],
      stage: storedGradeAndStage[1],
      correct: storedCorrectAndIncorrect[0],
      incorrect: storedCorrectAndIncorrect[1],
      recordedBy: userId,
      incorrectText: incorrectText
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
    // shuffle(sentencesArray);
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
    shuffle(sentences);
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
    $('#question-display').html(setSentences[count].question.replace(/(\s|　)/g, '<br>'));
    $('#close').removeClass('hidden');
    $('#cheat-zone').removeClass('hidden');
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
  judgeDispProcess('正解です！', 'correct');
  setTimeout(() => {
    nextQuestion();
  }, 1000);
}

function incorrectDisp(textRaw, answerRaw) {
  const answerExample = wordChoice(answerRaw);
  const exampleNum = Math.floor(Math.random() * answerExample.length);
  const incorrectText = '<span style="color: red">不正解です！</span><br>' +
                        `<span style="color: orange">あなたの解答</span><br>${textRaw}<br>` +
                        `<span style="color: orange">解答例はこちら</span><br>${answerExample[exampleNum]}`;
  judgeDispProcess(incorrectText, 'incorrect');
  incorrectSentences.push({
    grade: setSentences[count].grade,
    stage: setSentences[count].stage,
    question: setSentences[count].question,
    yourAnswer: textRaw,
    answerRaw: answerRaw,
    answerExample: answerExample[exampleNum]
  });
  setTimeout(() => {
    nextQuestion();
  }, 1000);
}

function cheatDisp(textRaw, answerRaw) {
  const answerExample = wordChoice(answerRaw);
  const exampleNum = Math.floor(Math.random() * answerExample.length);
  judgeDispProcess('次の問題に行きましょう！', 'cheat');
  incorrectSentences.push({
    grade: setSentences[count].grade,
    stage: setSentences[count].stage,
    question: setSentences[count].question,
    yourAnswer: textRaw,
    answerRaw: answerRaw,
    answerExample: answerExample[exampleNum]
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
    $('#question-display').html(setSentences[count].question.replace(/(\s|　)/g, '<br>'));
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
      incorrectText += `${e.grade}&&&${e.stage}&&&${recordReplacer(e.question)}&&&` +
                       `${recordReplacer(e.yourAnswer)}&&&${recordReplacer(e.answerExample)}|||`;
    });
    isRecorded = true;
  }
  if (incorrectCount === 0) {
    isRetried = false;
    $('#result-display').html(`全問正解！<br>${count}問中: 正解: ${count}問 不正解: 0問<br>正解率は100％でした！`);
    $('#incorrect-display').html('あなたは全問正解しました。');
  }
  else {
    isRetried = true;
    const correctCount = count - incorrectCount;
    const correctRate = Math.floor((correctCount / count) * 100);
    $('#result-display').html(`${count}問中: 正解: ${correctCount}問 不正解: ${incorrectCount}問<br>正解率は${correctRate}％でした！`);
    let storedText = '<h3>間違えた問題一覧</h3>';
    for (let i = 0; i < incorrectSentences.length; i++) {
      storedText += `<p>問題文: ${incorrectSentences[i].question}<br>
                  あなたの解答: ${incorrectSentences[i].yourAnswer}<br>
                  解答例はこちら: ${incorrectSentences[i].answerExample}</p>`
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
  $('#question-display').html(setSentences[count].question.replace(/(\s|　)/g, '<br>'));
  isStarted = true;
  isCheated = false;
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

function recordReplacer(str) {
  str = str.trim();
  if (!str) {
    str = '(tmp)';
  }
  str = str.replace(/\&{3,}/g, '(tmp)');
  str = str.replace(/\|{3,}/g, '(tmp)');
  str = str.slice(0, 255);
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
      tmpReplace = tmpReplace.replace(/\[((\w(\'|\,|\.|\?|\!)*)+\s+)+\/(\s+(\w(\'|\,|\.|\?|\!)*)*)+\]/, '&&&');
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
