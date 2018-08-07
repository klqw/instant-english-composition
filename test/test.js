'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const User = require('../models/user');
const Sentence = require('../models/sentence');

describe('/login', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('ログインのためのリンクが含まれる', (done) => {
    request(app)
      .get('/login')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a href="\/auth\/github"/)
      .expect(200, done);
  });

  it('ログイン時はユーザー名が表示される', (done) => {
    request(app)
      .get('/login')
      .expect(/testuser/)
      .expect(200, done);
  });
});

describe('/logout', () => {
  it('/ にリダイレクトされる', (done) => {
    request(app)
      .get('/logout')
      .expect('Location', '/')
      .expect(302, done);
  });
});

describe('/sentences', () => {
  before(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  after(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  it('問題文が作成でき、表示される(単数登録)', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/sentences/one')
        .send({ grade: 99, stage: 99, question: '投稿テスト', answer: 'PostTest' })
        .expect('Location', /sentences/)
        .expect(302)
        .end((err, res) => {
          const createdSentencePath = res.headers.location;
          request(app)
            .get(createdSentencePath)
            .expect(/投稿テスト/)
            .expect(/PostTest/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              done();
            });
        });
    });
  });

  it('問題文が作成でき、表示される(一括登録)', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/sentences/bulk')
        .send({ bulktext: '99|99|投稿テスト1|PostTest1\r\n99|99|投稿テスト2|PostTest2\r\n99|99|投稿テスト3|PostTest3' })
        .expect('Location', /sentences/)
        .expect(302)
        .end((err, res) => {
          const createdSentencePath = res.headers.location;
          request(app)
            .get(createdSentencePath)
            .expect(/投稿テスト1/)
            .expect(/投稿テスト2/)
            .expect(/投稿テスト3/)
            .expect(/PostTest1/)
            .expect(/PostTest2/)
            .expect(/PostTest3/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              done();
            });
        });
    });
  });

});
