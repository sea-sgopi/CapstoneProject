/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Chapter.belongsTo(models.Course, {
        foreignKey: "courseId",
      });
      Chapter.hasMany(models.Page, {
        foreignKey: "chapterId",
      });
    }

    static async findByCourseId(courseId) {
      try {
        const chapters = await Chapter.findAll({
          where: {
            courseId: courseId,
          },
          include: {
            model: sequelize.models.Course,
            attributes: ["name"],
          },
          order: [["createdAt", "ASC"]], // Optional: order chapters by creation date
        });
        return chapters;
      } catch (error) {
        console.error("Error fetching chapters for course:", error);
        throw error;
      }
    }

    static async findChapterWithPages(chapterId) {
      try {
        const chapter = await Chapter.findOne({
          where: { id: chapterId },
          include: [
            {
              model: sequelize.models.Page,
              as: "Pages",
            },
          ],
        });

        if (!chapter) {
          throw new Error("Chapter not found");
        }

        return {
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          pages: chapter.Pages.map((page) => ({
            id: page.id,
            title: page.title,
            content: page.content,
          })),
        };
      } catch (error) {
        console.error("Error fetching chapter with pages:", error);
        throw error;
      }
    }
  }
  Chapter.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Chapter",
      timestamps: true,
    },
  );
  return Chapter;
};
