'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Incorrect = loader.database.define('incorrect', {
  incorrectId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  recordId: {
    type: Sequelize.UUID,
    allowNull: false
  },
  grade: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  stage: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  question: {
    type: Sequelize.STRING,
    allowNull: false
  },
  yourAnswer: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: ' '
  },
  correctAnswer: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      fields: ['recordId']
    }
  ]
});

module.exports = Incorrect;
