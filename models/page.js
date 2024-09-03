/* eslint-disable no-unused-vars */
"use strict";
const { Model, Op } = require("sequelize");
const completion = require("./completion");
module.exports = (sequelize, DataTypes) => {
  class Page extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Page.belongsTo(models.Chapter, {
        foreignKey: "chapterId",
      });
    }

    static async isPageCompleted(studentId, pageId) {
      try {
        const completed = await sequelize.models.Completion.findOne({
          where: {
            pageId,
            studentId,
            completed: true,
          },
          limit: 1,
        });
        return !!completed;
      } catch (error) {
        console.error(
          "Error checking page completion status for student:",
          error,
        );
        throw error;
      }
    }

    static async findNextPageId(pageId) {
      try {
        const currentPage = await Page.findByPk(pageId);
        if (!currentPage) {
          throw new Error(`Page with ID ${pageId} not found`);
        }
        const nextPage = await Page.findOne({
          where: {
            chapterId: currentPage.chapterId,
            id: {
              [Op.gt]: pageId,
            },
          },
          order: [["id", "ASC"]],
        });
        const nextPageId = nextPage ? nextPage.id : null;
        return nextPageId;
      } catch (error) {
        console.error("Error finding next page and maxPage", error);
        throw error;
      }
    }
  }
  Page.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      chapterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Page",
      timestamps: true,
    },
  );
  return Page;
};
