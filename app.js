/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { User, Course } = require("./models");
const path = require("path");
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

app.use(
  session({
    secret: "my-secret-key-19298487291302847839",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hrs
    },
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
app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

// Route

app.get("/", (request, response) => {
  response.render("index", {
    title: "Capstone Project",
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
    console.log("Creating user: ", request.body);
    const user = await User.create({
      role: request.body.role,
      fullName: request.body.fullName,
      email: request.body.email,
      password: hashedPwd,
    });
    console.log("User created:", user.dataValues);
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
      request.flash("error", "The email address is already in use.");
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
  async (request, response) => {
    // Logic
    try {
      const userId = request.user.id;
      const username = await User.username(userId);
      const coursesWithEducator = await Course.coursesWithEducator();
      if (request.accepts("html")) {
        response.render("educator-dashboard", {
          title: "Dashboard",
          coursesWithEducator,
          username,
        });
      } else {
        response.json({
          coursesWithEducator,
        });
      }
    } catch (error) {
      console.error("error: ", error);
      response.status(500).send("Internal Server Error");
    }
  },
);

app.get("/student-dashboard", (request, response) => {
  // Logic
  response.render("student-dashboard", {
    title: "Dashboard",
  });
});

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
    request.flash("success", "Password successfully updated.");
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
  return response.render("test");
});

module.exports = app;
