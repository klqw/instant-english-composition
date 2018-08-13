'use strict';
import $ from 'jquery';

const selects = $('#select-value').data('selects');

$('#post-grade').change(() => {
  const selectValue = parseInt($('#post-grade').val());
  let selectHtml = '';
  selects.forEach((s) => {
    if (selectValue === s.grade) {
      selectHtml += `<option value="${s.stage}">${s.text}</option>`;
    }
  });
  $('#post-stage').html(selectHtml);
});

$(document).ready(() => {
  if (document.URL.match(/edit/) || document.URL.match(/search\?grade/)) {
    const grade = $('#stored-select').data('grade') || 1;
    const stage = $('#stored-select').data('stage') || 1;
    $('#post-grade').val(grade);
    let selectHtml = '';
    selects.forEach((s) => {
      if (grade === s.grade) {
        selectHtml += `<option value="${s.stage}">${s.text}</option>`;
      }
    });
    $('#post-stage').html(selectHtml);
    $('#post-stage').val(stage);
  } else {
    return;
  }
});
