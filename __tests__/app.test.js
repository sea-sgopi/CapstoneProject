/* eslint-disable no-unused-vars */
const request = require("supertest");
const app = require("../app");
const db = require("../models");
const bcrypt = require("bcrypt");

let server,
  agent,
  cookies,
  courseId,
  studentCookies,
  chapterId,
  pageId,
  studentId;

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
  server = app.listen(31000, () => {});
  agent = request.agent(server);
});

afterAll(async () => {
  await db.sequelize.close();
  await server.close();
});

describe("Capstone Project", () => {
  test("Sign up as Educator", async () => {
    const response = await agent.post("/users").send({
      role: "Educator",
      fullName: "John Doe",
      userName: "john_doe",
      email: "john@example.com",
      password: "password123",
    });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/signup");

    const user = await db.User.findOne({
      where: { email: "john@example.com" },
    });
    expect(user).not.toBeNull();
    expect(user.role).toBe("Educator");
  });

  test("Log in as Educator", async () => {
    let res = await agent.get("/login");

    const response = await agent.post("/save").send({
      email: "john@example.com",
      password: "password123",
    });
    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/educator-dashboard");
    cookies = response.headers["set-cookie"];
  });

  test("Create a new course", async () => {
    const cookieString = cookies.join("; ");

    let res = await agent.get("/courses/new").set("Cookie", cookieString);
    const courseResponse = await agent
      .post("/courses/new")
      .set("Cookie", cookieString)
      .field("course", "Test Course");

    expect(courseResponse.status).toBe(302);
    const course = await db.Course.findOne({ where: { name: "Test Course" } });
    expect(course).not.toBeNull();

    courseId = course.id;
  });

  test("Add a chapter to the course", async () => {
    const cookieString = cookies.join("; ");
    let res = await agent
      .get(`/courses/${courseId}/chapters/new`)
      .set("Cookie", cookieString);
    const response = await agent
      .post(`/courses/${courseId}/chapters/new`)
      .set("Cookie", cookieString)
      .send({
        title: "Chapter 1",
        description: "Introduction to the course",
      });

    expect(response.status).toBe(302);
    const chapter = await db.Chapter.findOne({ where: { title: "Chapter 1" } });
    expect(chapter).not.toBeNull();

    chapterId = chapter.id;
  });

  test("Add a page to the chapter", async () => {
    const cookieString = cookies.join("; ");
    let res = await agent
      .get(`/courses/${courseId}/chapters/${chapterId}/pages/new`)
      .set("Cookie", cookieString);

    const response = await agent
      .post(`/courses/${courseId}/chapters/${chapterId}/pages/new`)
      .set("Cookie", cookieString)
      .send({
        title: "Page 1",
        content: "This is the first page of the course.",
      });

    expect(response.status).toBe(302);
    const page = await db.Page.findOne({ where: { title: "Page 1" } });
    expect(page).not.toBeNull();
    pageId = page.id;
  });

  test("Sign up a Student", async () => {
    let res = await agent.get("/signup");

    const response = await agent.post("/users").send({
      role: "Student",
      fullName: "Jane Student",
      userName: "student_jane",
      email: "student@example.com",
      password: "password123",
    });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/signup");

    const user = await db.User.findOne({
      where: { email: "student@example.com" },
    });
    expect(user).not.toBeNull();
    expect(user.role).toBe("Student");
    studentId = user.id;
  });

  test("Log in as student", async () => {
    let res = await agent.get("/login");

    const response = await agent.post("/save").send({
      email: "student@example.com",
      password: "password123",
    });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe("/student-dashboard");

    studentCookies = response.headers["set-cookie"];
  });

  test("Show the chapter's list of a Course", async () => {
    const cookieString = studentCookies.join("; ");
    const res = await agent
      .get(`/courses/${courseId}/chapters`)
      .set("Cookie", cookieString);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Chapter 1");
  });

  test("Allow a Student to enroll for a course", async () => {
    const cookieString = studentCookies.join("; ");
    let res = await agent
      .get(`/courses/${courseId}/enroll`)
      .set("Cookie", cookieString);

    expect(res.status).toBe(302);
    const enrollment = await db.Enrollment.findOne({
      where: { studentId, courseId },
    });
    expect(enrollment).not.toBeNull();
  });

  test("Show the Chapter's pages", async () => {
    const cookieString = studentCookies.join("; ");
    const res = await agent
      .get(`/courses/${courseId}/chapters/${chapterId}`)
      .set("Cookie", cookieString);

    expect(res.status).toBe(200);
    expect(res.text).toContain("Page 1");
  });

  test("Allow the Student to mark a page as complete", async () => {
    const cookieString = studentCookies.join("; ");
    let res = await agent
      .get(`/courses/${courseId}/chapters/${chapterId}/pages/${pageId}/markAsComplete`)
      .set("Cookie", cookieString);

    expect(res.status).toBe(302);
    const completion = await db.Completion.findOne({
      where: { studentId, pageId },
    });
    expect(completion).not.toBeNull();
  });
});
