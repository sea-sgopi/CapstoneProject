/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const {
  User,
  Course,
  Chapter,
  Page,
  Enrollment,
  Completion,
} = require("./models");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;
// set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const { where } = require("sequelize");
const { error } = require("console");
const { title } = require("process");
const { userInfo } = require("os");

app.use(
  session({
    secret: "my-secret-key-19298487291302847839",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hrs
    },
    //   resave: false,
    // saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Passport Strategy

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (username, password, done) => {
      const user = User.findOne({
        where: {
          email: username,
        },
      })
        .then(async (user) => {
          if (!user) {
            return done(null, false, { message: "User not found" });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          return done(error);
        });
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log("Serialing the user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

// middlewares

const requireRole = (roles) => {
  return (request, response, next) => {
    if (request.user && roles.includes(request.user.role)) {
      return next();
    } else {
      response.status(401).json({ message: "Unauthorized user." });
    }
  };
};

// Add connect-flash middleware
app.use(flash());

// Middleware to expose flash messages to views
app.use(async (request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

// Set storage engine

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname),
    );
  },
});

// Init upload

const upload = multer({
  storage: storage,
  limits: { fileSize: 3000000 }, // 3MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("photo");

// Check file type

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Route

app.get("/", (request, response) => {
  response.render("index", {
    title: "Capstone Project",
  });
});

app.get("/error/:statusCode", (req, res) => {
  const statusCode = req.params.statusCode || 500;
  let statusMessage = "";

  switch (statusCode) {
    case "400":
      statusMessage = "Bad Request";
      break;
    case "401":
      statusMessage = "Unauthorized";
      break;
    case "403":
      statusMessage = "Forbidden";
      break;
    case "404":
      statusMessage = "Page Not Found";
      break;
    case "405":
      statusMessage = "Method Not Allowed";
      break;
    case "500":
      statusMessage = "Internal Server Error";
      break;
    case "502":
      statusMessage = "Bad Gateway";
      break;
    case "503":
      statusMessage = "Service Unavailable";
      break;
    case "504":
      statusMessage = "Gateway Timeout";
      break;
    default:
      statusMessage = "Something Went Wrong";
  }
  res.render("error", {
    statusCode: statusCode,
    statusMessage: statusMessage,
  });
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Sign Up",
  });
});

app.get("/login", (request, response) => {
  response.render("login", {
    title: "Login",
  });
});

app.post("/users", async (request, response) => {
  // Logic
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    if (request.body.password === "") {
      throw new Error("Validation notEmpty on password failed");
    }
    const user = await User.create({
      role: request.body.role,
      fullName: request.body.fullName,
      userName: request.body.userName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log("Login error:", err);
      }
      request.flash("success", "Account has been created successfully.");
      response.redirect("/signup");
    });
  } catch (error) {
    console.error("User creation error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      request.flash(
        "error",
        "The email address OR User Name  is already in use.",
      );
    } else {
      request.flash("error", "An error occurred. Please try again.");
    }
    response.redirect("/signup");
  }
});

app.post(
  "/save",
  passport.authenticate("local", {
    // Logic
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    const userRole = request.user.role;
    if (userRole === "Student") {
      requireRole(["Student"])(request, response, () => {
        response.redirect("/student-dashboard");
      });
    } else if (userRole === "Educator") {
      requireRole(["Educator"])(request, response, () => {
        response.redirect("/educator-dashboard");
      });
    } else {
      response
        .status(401)
        .json({ message: "Forbidden: Unauthorized user role." });
    }
  },
);

app.get(
  "/educator-dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    // Logic
    try {
      const userId = request.user.id;
      const fullname = await User.fullname(userId);
      const username = await User.fullname(userId);
      const userRole = request.user.role;
      const coursesWithEducator = await Course.coursesWithEducator();
      const count = await Enrollment.findEnrollmentsWithPopularity();
      if (request.accepts("html")) {
        response.render("educator-dashboard", {
          title: "Dashboard",
          coursesWithEducator,
          fullname,
          username,
          userRole,
          count,
        });
      } else {
        response.json({
          coursesWithEducator,
        });
      }
    } catch (error) {
      console.error("error: ", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/student-dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Student"]),
  async (request, response) => {
    // Logic
    try {
      const userId = request.user.id;
      const fullname = await User.fullname(userId);
      const username = await User.username(userId);
      const courses = await Enrollment.enrolledCourses(userId);
      const enrolled = await Enrollment.enrolledIds(userId);
      const userRole = request.user.role;
      const coursesWithEducator = await Course.coursesWithEducator();
      const count = await Enrollment.findEnrollmentsWithPopularity();
      console.log(`User ID from request: ${request.user.id}`);
      if (request.accepts("html")) {
        response.render("student-dashboard", {
          title: "Dashboard",
          coursesWithEducator,
          fullname,
          username,
          courses,
          enrolled,
          userRole,
          count,
        });
      } else {
        response.json({
          coursesWithEducator,
        });
      }
    } catch (error) {
      console.error("error: ", error);
      response.redirect("/error/500");
    }
  },
);

app.get("/forgot-password", (request, response) => {
  // Logic
  response.render("forgot-password", {
    title: "Forgot Password",
  });
});

app.get("/change-password", (request, response) => {
  // Logic
  response.render("change-password", {
    title: "Change Password",
  });
});

app.post("/change", async (request, response) => {
  // Logic
  const {
    email,
    password,
    "new-password": newPassword,
    "confirm-password": confirmPassword,
  } = request.body;
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      request.flash("error", "User not found.");
      return response.redirect("/change-password");
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      request.flash("error", "Incorrect current password.");
      return response.redirect("/change-password");
    }
    if (newPassword !== confirmPassword) {
      request.flash("error", "New password and confirm password do not match.");
      return response.redirect("/change-password");
    }

    const hashedNewPwd = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedNewPwd;
    await user.save();
    request.flash("update", "Password successfully updated.");
    return response.redirect("/change-password");
  } catch {
    console.error("password update Failure", error);
    request.flash(
      "error",
      "An error occurred while updating the password. Please try again.",
    );
    return response.redirect("/change-password");
  }
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get("/test", (request, response) => {
  // Logic
  return response.render("test", {
    title: "Test View",
  });
});

app.get("/development", (request, response) => {
  // Logic
  return response.render("development", {
    title: "Development View",
  });
});

app.get(
  "/new-course",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  (request, response) => {
    // Logic
    return response.render("new-course", {
      title: "Create a New Course",
    });
  },
);

app.post(
  "/new-course",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    upload(request, response, async (error) => {
      if (error) {
        response.render("new-course", { msg: error });
      } else {
        try {
          const { course } = request.body;
          const educatorId = request.user.id;
          if (!course) {
            return response.status(400).send("Course name is required");
          }
          const newCourse = await Course.create({
            name: course,
            educatorId,
            photo: request.file ? `/uploads/${request.file.filename}` : null,
          });
          request.flash("done", "Course has been created successfully.");
          response.redirect(`/courses/${newCourse.id}/chapters/new`);
        } catch (error) {
          console.error("Course creation error:", error);
          request.flash("error", "An error occurred. Please try again.");
          response.redirect("/courses/new");
        }
      }
    });
  },
);

app.get(
  "/courses/:courseId/chapters/new",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    // Logic
    try {
      const { courseId } = request.params;
      const course = await Course.findByPk(courseId);
      const chapters = await Chapter.findByCourseId(courseId);

      if (!course) {
        request.flash("error", "Course not found.");
        return response.redirect("/courses/new");
      }

      response.render("new-chapter", {
        course,
        chapters,
        title: "Create Chapter",
      });
    } catch (error) {
      console.error("Error loading chapter creation page:", error);
      response.redirect("/error/500");
    }
  },
);

app.post(
  "/courses/:courseId/chapters/new",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    // Logic
    try {
      const { courseId } = request.params;
      const chapter = await Chapter.create({
        title: request.body.title,
        description: request.body.description,
        courseId,
      });

      request.flash("done", "Chapter has been added successfully.");
      response.redirect(
        `/courses/${courseId}/chapters/${chapter.id}/pages/new`,
      );
    } catch (error) {
      const { courseId, chapterId } = request.params;
      console.error("Chapter creation error:", error);
      request.flash("error", "An error occurred. Please try again.");
      response.redirect(`/courses/${courseId}/chapters/new`);
    }
  },
);

app.get(
  "/courses/:courseId/chapters/:chapterId/pages/new",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    // Logic
    try {
      const { courseId, chapterId } = request.params;
      const chapters = await Chapter.findAll({ where: { courseId } });
      response.render("new-page", {
        course: await Course.findByPk(courseId),
        chapter: await Chapter.findByPk(chapterId),
        chapters,
        title: "Add Page",
      });
    } catch (error) {
      console.error(
        "Error loading page creation form: or loading chapters:",
        error,
      );
      response.redirect("/error/500");
    }
  },
);

app.post(
  "/courses/:courseId/chapters/:chapterId/pages/new",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    // Logic
    try {
      const { courseId, chapterId: defaultChapterId } = request.params;
      const chapterId = request.body.chapterId || defaultChapterId;

      await Page.create({
        title: request.body.title,
        content: request.body.content,
        chapterId,
      });

      request.flash("done", "Page has been added successfully.");
      response.redirect(`/courses/${courseId}/chapters/${chapterId}/pages/new`);
    } catch (error) {
      const { courseId, chapterId } = request.params;
      console.error("Page creation error:", error);
      request.flash("error", "An error occurred. Please try again.");
      response.redirect(`/courses/${courseId}/chapters/${chapterId}/pages/new`);
    }
  },
);

app.get(
  "/my-courses",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    // Logic
    try {
      const userId = request.user.id;
      const fullname = await User.fullname(userId);
      const myCourses = await Course.myCourses(userId);
      response.render("my-courses", {
        title: "My Courses",
        myCourses,
        fullname,
      });
    } catch (error) {
      console.error("Error loading my courses:", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/view-chapters/:courseId",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator", "Student"]),
  async (request, response) => {
    // Logic
    try {
      const userRole = request.user.role;
      const courseId = request.params.courseId;
      const courseName = await Course.courseFullName(courseId);
      const userId = request.user.id;
      const fullname = await User.fullname(userId);
      const enroll = await Enrollment.isUserEnrolled(userId, courseId);
      const courses = await Enrollment.enrolledCourses(userId);
      const enrolled = await Enrollment.enrolledIds(userId);
      const total = await Enrollment.Enrollments(courseId);
      const chapters = await Chapter.findByCourseId(courseId);
      response.render("view-chapters", {
        title: "View Courses",
        chapters,
        courseId,
        courseName,
        courses,
        fullname,
        enrolled,
        enroll,
        userRole,
        total,
      });
    } catch (error) {
      console.error("Error loading courses chapters:", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/view-pages/:chapterId",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator", "Student"]),
  async (request, response) => {
    // Logic
    try {
      const userRole = request.user.role;
      const userId = request.user.id;
      const chapterId = request.params.chapterId;
      const courseId = request.params.courseId;
      console.log(`courseID === ${courseId}`);
      const courses = await Enrollment.enrolledCourses(userId);
      const isCompleted = await Chapter.isChapterCompleted(userId, chapterId);
      const chapter = await Chapter.findChapterWithPages(chapterId, {
        include: [Page],
      });
      if (!chapter) {
        request.flash("error", "Chapter Not Found");
        return response.redirect(`/view-course/${chapter.courseId}`);
      }
      const pages = chapter.pages;
      response.render("view-pages", {
        title: `View Chapter: ${chapter.title}`,
        chapter,
        pages,
        userRole,
        courses,
        isCompleted,
      });
    } catch (error) {
      console.error("Error loading pages:", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/view-page/:pageId",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Student", "Educator"]),
  async (request, response) => {
    // Logic
    try {
      const studentId = request.user.id;
      const pageId = request.params.pageId;
      const userRole = request.user.role;
      const page = await Page.findByPk(pageId);
      const nextId = await Page.findNextPageId(pageId);
      const isCompleted = await Page.isPageCompleted(studentId, pageId);
      if (!page) {
        request.flash("error", "Page Not Found");
        return response.redirect(`/error`);
      }
      response.render("view-page", {
        title: `${page.title}`,
        page,
        isCompleted,
        userRole,
        nextId,
      });
    } catch (error) {
      console.error("Error loading pages:", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/enroll/:courseId",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Student"]),
  async (request, response) => {
    // Logic
    try {
      const courseId = request.params.courseId;
      const studentId = request.user.id;
      if (await Enrollment.isUserEnrolled(studentId, courseId)) {
        request.flash("error", "You are already enrolled in this course.");
        return response.redirect(`/student-dashboard`); // Need to change
      }
      await Enrollment.create({
        studentId: studentId,
        courseId: courseId,
      });
      request.flash("done", "Successfully enrolled in the course!");
      response.redirect(`/student-dashboard`); // need to change
    } catch (error) {
      console.error("Error loading my courses:", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/enrolled-courses",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Student"]),
  async (request, response) => {
    try {
      const studentId = request.user.id;
      const courses = await Enrollment.enrolledCourses(studentId);
      for (const course of courses) {
        course.progress = await Enrollment.calculateProgress(
          studentId,
          course.courseId,
        );
        const nextPage = await Page.findNextIncompletePage(
          studentId,
          course.courseId,
        );
        course.nextPageId = nextPage ? nextPage.id : null;
      }
      const enrolled = await Enrollment.enrolledIds(studentId);
      const fullname = await User.fullname(studentId);
      const username = await User.username(studentId);
      const userRole = request.user.role;
      const coursesWithEducator = await Course.coursesWithEducator();
      const count = await Enrollment.findEnrollmentsWithPopularity();
      response.render("enrolled-courses", {
        title: "My Courses",
        courses,
        fullname,
        enrolled,
        username,
        coursesWithEducator,
        userRole,
        count,
      });
    } catch (error) {
      console.error("Error loading enrolled courses:", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/view-reports",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Educator"]),
  async (request, response) => {
    try {
      const userId = request.user.id;
      const courses = await Enrollment.findEnrollmentsWithPopularity();
      const fullname = await User.fullname(userId);

      response.render("view-reports", {
        title: "Courses Report",
        courses,
        fullname,
      });
      console.log(`Total Students: ${courses[0].totalStudents}`);
    } catch (error) {
      console.error("Error loading enrolled courses:", error);
      response.redirect("/error/500");
    }
  },
);

app.get(
  "/mark-complete/:pageId",
  connectEnsureLogin.ensureLoggedIn(),
  requireRole(["Student"]),
  async (request, response) => {
    try {
      const studentId = request.user.id;
      const pageId = request.params.pageId;
      const completion = await Completion.markAsComplete(studentId, pageId);
      if (!completion) {
        request.flash("error", "Completion record not found");
        return response.redirect(`/view-page/${pageId}`);
      } else {
        request.flash("done", "Completed");
        return response.redirect(`/view-page/${pageId}`);
      }
    } catch (error) {
      console.error("Error marking page as complete:", error);
      response.redirect("/error/500");
    }
  },
);

module.exports = app;
