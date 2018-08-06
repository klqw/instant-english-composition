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

  it('問題文が作成でき、表示される', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/sentences')
        .send({ grade: 0, stage: 0, question: 'こんにちは', answer: 'hello' })
        .expect('Location', /sentences/)
        .expect(302)
        .end((err, res) => {
          const createdSentencePath = res.headers.location;
          request(app)
            .get(createdSentencePath)
            .expect(/こんにちは/)
            .expect(/hello/)
            .expect(200)
            .end((err, res) => {
              // テストで作成したデータを削除
              Sentence.findAll({
                where: { grade: 0 }
              }).then((sentences) => {
                sentences.forEach((s) => { s.destroy(); });
              });
              if (err) return done(err);
              done();
            });
        });
    });
  });
  
});
