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
        // Corrected pages for Course 1
        {
          title: "Introduction to Variables",
          chapterId: 1,
          content: "Basics of variables in programming.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Data Types",
          chapterId: 1,
          content: "Overview of data types.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Control Flow Basics",
          chapterId: 2,
          content: "Control flow statements overview.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Functions Basics",
          chapterId: 2,
          content: "Introduction to functions.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "OOP Principles",
          chapterId: 3,
          content: "Understanding OOP principles.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Error Handling Techniques",
          chapterId: 3,
          content: "Error handling in programming.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // Corrected pages for Course 2
        {
          title: "HTML Basics",
          chapterId: 4,
          content: "Introduction to HTML.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "CSS Basics",
          chapterId: 4,
          content: "Introduction to CSS.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "JavaScript Basics",
          chapterId: 5,
          content: "JavaScript syntax and basics.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "DOM Manipulation",
          chapterId: 5,
          content: "Manipulating the DOM with JavaScript.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Responsive Design Basics",
          chapterId: 6,
          content: "Principles of responsive design.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Flexbox Layout",
          chapterId: 6,
          content: "Using Flexbox for layout.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "API Integration",
          chapterId: 7,
          content: "How to work with APIs.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Asynchronous JavaScript",
          chapterId: 7,
          content: "Understanding async JavaScript.",
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
