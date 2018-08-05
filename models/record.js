'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Record = loader.database.define('records', {
  recordId: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false
  },
  course: {
    type: Sequelize.STRING,
    allowNull: false
  },
  grade: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  stage: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  correct: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  incorrect: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  recordedBy: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  recordedAt: {
    type: Sequelize.DATE,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false,
  indexes: [
    {
      fields: ['recordedBy']
    }
  ]
});

module.exports = Record;
