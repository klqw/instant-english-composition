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
