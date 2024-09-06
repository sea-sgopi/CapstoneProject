"use strict";
const { Model, Op } = require("sequelize");
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

    static async enrolledIds(studentId) {
      try {
        const enrollments = await Enrollment.findAll({
          where: {
            studentId: studentId,
          },
          attributes: ["courseId"],
        });

        return enrollments.map((enrollment) => enrollment.courseId);
      } catch (error) {
        console.error("Error fetching enrolled courses Ids:", error);
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

    static async findEnrollmentsWithPopularity() {
      try {
        const totalStudents = await sequelize.models.User.count({
          where: {
            role: "Student",
          },
        });
        const courseEnrollments = await Enrollment.findAll({
          include: [
            {
              model: sequelize.models.Course,
              attributes: ["id", "name"],
            },
          ],
          attributes: [
            [sequelize.fn("COUNT", sequelize.col("studentId")), "studentCount"],
            "courseId",
          ],
          group: ["courseId", "Course.id"],
        });

        const allCourses = await sequelize.models.Course.findAll({
          attributes: ["id", "name"],
        });

        const enrollmentMap = courseEnrollments.reduce((map, enrollment) => {
          map[enrollment.courseId] = enrollment.get("studentCount");
          return map;
        }, {});

        return allCourses.map((course) => {
          const studentCount = enrollmentMap[course.id] || 0;
          return {
            courseId: course.id,
            courseName: course.name,
            studentCount,
            totalStudents,
            popularity:
              totalStudents > 0
                ? ((studentCount / totalStudents) * 100).toFixed(2)
                : 0,
          };
        });
      } catch (error) {
        console.error("Error fetching enrollments with popularity:", error);
        throw error;
      }
    }

    static async calculateProgress(studentId, courseId) {
      try {
        const chapters = await sequelize.models.Chapter.findAll({
          where: {
            courseId,
          },
          include: [
            {
              model: sequelize.models.Page,
              as: "Pages",
            },
          ],
        });

        const totalPages = chapters.reduce(
          (count, chapter) => count + chapter.Pages.length,
          0,
        );

        if (totalPages === 0) return 0; // If no pages, progress is 0%
        const completedPages = await sequelize.models.Completion.count({
          where: {
            studentId,
            completed: true,
            pageId: {
              [Op.in]: chapters.reduce(
                (pageIds, chapter) =>
                  pageIds.concat(chapter.Pages.map((page) => page.id)),
                [],
              ),
            },
          },
        });

        const progress = Math.round((completedPages / totalPages) * 100);
        return progress;
      } catch (error) {
        console.error("Error calculating course progress:", error);
        throw error;
      }
    }

    static async Enrollments(courseId) {
      try {
        const count = await Enrollment.count({
          where: {
            courseId,
          },
          distinct: true,
          col: "studentId",
        });

        return count;
      } catch (error) {
        console.error("Error counting students enrolled in course:", error);
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
