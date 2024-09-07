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
          id: course.id,
          title: course.name,
          educatorName: course.educator ? course.educator.fullName : "Unknown",
          course: course,
        }));
      } catch (error) {
        console.error("Error fetching courses with educators:", error);
        throw error;
      }
    }

    static async courseFullName(courseId) {
      try {
        const course = await Course.findByPk(courseId, {
          attributes: ["name"],
        });

        if (!course) {
          throw new Error("Course not found");
        }

        return course.name;
      } catch (error) {
        console.error("Error finding courses Name:", error);
        throw error;
      }
    }

    static async myCourses(userId) {
      try {
        const courses = await Course.findAll({
          where: {
            educatorId: userId,
          },
          include: {
            model: sequelize.models.User,
            as: "educator",
            attributes: ["fullName"],
          },
        });

        return courses.map((course) => ({
          id: course.id,
          title: course.name,
          photo: course.photo,
          educatorName: course.educator ? course.educator.fullName : "Unknown",
        }));
      } catch (error) {
        console.error("Error fetching courses for user:", error);
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
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
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
