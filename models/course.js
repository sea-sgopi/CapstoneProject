/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Course.belongsTo(models.User, {
        foreignKey: "educatorId",
        as: "educator",
      });
      Course.hasMany(models.Chapter, {
        foreignKey: "courseId",
      });
      Course.hasMany(models.Enrollment, {
        foreignKey: "courseId",
      });
    }

    static async coursesWithEducator() {
      try {
        const courses = await Course.findAll({
          include: {
            model: sequelize.models.User,
            as: "educator",
            attributes: ["fullName"],
          },
        });

        return courses.map((course) => ({
          title: course.name,
          description: course.description,
          educatorName: course.educator ? course.educator.fullName : "Unknown",
        }));
      } catch (error) {
        console.error("Error fetching courses with educators:", error);
        throw error;
      }
    }
  }
  Course.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      educatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Course",
      timestamps: true,
    },
  );
  return Course;
};
