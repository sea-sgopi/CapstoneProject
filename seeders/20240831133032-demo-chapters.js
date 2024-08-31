/* eslint-disable no-unused-vars */
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      "Chapters",
      [
        {
          title: "Introduction",
          description: "Basics of Course 1",
          courseId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Intermediate Concepts",
          description: "Advanced topics of Course 1",
          courseId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Advanced Topics",
          description: "Deep dive into Course 1",
          courseId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Basics of Web Development",
          description: "Introduction to web dev",
          courseId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Intermediate Web Development",
          description: "Advanced web dev concepts",
          courseId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Advanced Web Topics",
          description: "Deep dive into web dev",
          courseId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Project Work",
          description: "Hands-on projects",
          courseId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Chapters", null, {});
  },
};
