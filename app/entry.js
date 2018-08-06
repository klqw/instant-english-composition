'use strict';
import $ from 'jquery';

$('.open').each((i, e) => {
  const button = $(e);
  button.click(() => {
    const grade = button.data('grade');
    const stage = button.data('stage');
    console.log(grade);
    console.log(stage);
  });
});

const flag = $('.course-flag').val();
console.log(flag);
