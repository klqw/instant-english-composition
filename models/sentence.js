'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Sentence = loader.database.define('sentences', {
  sentenceId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
  answer: {
    type: Sequelize.STRING,
    allowNull: false
  },
  createdBy: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      fields: ['createdBy']
    }
  ]
});

module.exports = Sentence;
