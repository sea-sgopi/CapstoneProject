/* eslint-disable no-unused-vars */
"use strict";
const { Model, Op } = require("sequelize");
const completion = require("./completion");
const { use } = require("passport");
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
      Page.belongsTo(models.User, {
        foreignKey: "educatorId",
        as: "creator",
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

    static async findNextIncompletePage(studentId, courseId) {
      try {
        const pages = await sequelize.models.Page.findAll({
          include: {
            model: sequelize.models.Chapter,
            where: { courseId },
          },
          order: [["id", "ASC"]],
        });

        for (const page of pages) {
          const isCompleted = await sequelize.models.Completion.findOne({
            where: {
              studentId,
              pageId: page.id,
              completed: true,
            },
          });

          if (!isCompleted) {
            return page;
          }
        }

        return null;
      } catch (error) {
        console.error("Error finding next incomplete page:", error);
        throw error;
      }
    }

    static async isPageCreatedByUser(userId, pageId) {
      try {
        const page = await Page.findOne({
          where: {
            id: pageId,
            educatorId: userId,
          },
        });

        return !!page;
      } catch (error) {
        console.error("Error checking is the user created the page", error)
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
      educatorId: {
        type: DataTypes.INTEGER,
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
