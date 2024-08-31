/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Completion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Completion.belongsTo(models.Page, {
        foreignKey: "pageId",
      });
      Completion.belongsTo(models.User, {
        foreignKey: "studentId",
      });
    }
  }
  Completion.init(
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Completion",
      timestamps: false,
    },
  );
  return Completion;
};
