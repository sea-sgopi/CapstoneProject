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
      "Pages",
      [
        {
          title: "Introduction to Variables",
          chapterId: 1,
          content: "This page covers the basics of variables in programming.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Functions and Methods",
          chapterId: 2,
          content: "Learn about functions and methods in programming.",
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
    await queryInterface.bulkDelete("Pages", null, {});
  },
};
