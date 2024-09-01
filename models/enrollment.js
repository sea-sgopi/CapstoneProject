/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Enrollment.belongsTo(models.User, {
        foreignKey: "studentId",
      });
      Enrollment.belongsTo(models.Course, {
        foreignKey: "courseId",
      });
    }

    static async enrolledCourses(studentId) {
      try {
        const enrollments = await Enrollment.findAll({
          where: {
            studentId: studentId,
          },
          include: [
            {
              model: sequelize.models.Course,
              include: [
                {
                  model: sequelize.models.User,
                  as: "educator",
                  attributes: ["fullName"],
                },
              ],
            },
          ],
        });

        return enrollments.map((enrollment) => ({
          studentId: studentId,
          courseId: enrollment.Course.id,
          title: enrollment.Course.name,
          educatorName: enrollment.Course.educator
            ? enrollment.Course.educator.fullName
            : "Unknown",
        }));
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        throw error;
      }
    }

    static async findAllEnrollments() {
      try {
        const enrollments = await Enrollment.findAll({
          include: [
            {
              model: sequelize.models.User,
              attributes: ["id", "fullName"],
            },
            {
              model: sequelize.models.Course,
              attributes: ["id", "name"],
            },
          ],
        });
        console.log("Raw Enrollments Data:", enrollments);
        return enrollments.map((enrollment) => ({
          studentId: enrollment.studentId,
          studentName: enrollment.User.fullName,
          courseId: enrollment.courseId,
          courseName: enrollment.Course.name,
        }));
      } catch (error) {
        console.error("Error fetching all enrollments:", error);
        throw error;
      }
    }

    static async isUserEnrolled(studentId, courseId) {
      try {
        const enrollment = await Enrollment.findOne({
          where: {
            studentId,
            courseId,
          },
        });

        return !!enrollment;
      } catch (error) {
        console.error("Error checking enrollment by user ID:", error);
        throw error;
      }
    }
  }
  Enrollment.init(
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      progress: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "Enrollment",
      timestamps: true,
    },
  );
  return Enrollment;
};
