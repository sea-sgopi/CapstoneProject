/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { User } = require("./models");
const path = require("path");
const bcrypt = require("bcrypt");

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

// middleware

const requireRole = (roles) => {
  return (request, response, next) => {
    if (request.user && roles.includes(request.user.role)) {
      return next();
    } else {
      response.status(401).json({ message: "Unauthorized user." });
    }
  };
};

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
      response.redirect("/test");
    });
  } catch (error) {
    console.error("User creation error:", error);
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => err.message);
      response.redirect("/signup");
    } else {
      response.redirect("/signup");
    }
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

app.get("/educator-dashboard", (request, response) => {
  // Logic
  response.render("educator-dashboard", {
    title: "Dashboard",
  });
});

app.get("/student-dashboard", (request, response) => {
  // Logic
  response.render("student-dashboard", {
    title: "Dashboard",
  });
});

app.get("/forgot-password", (request, response) => {
  // Logic
});

app.get("/test", (request, response) => {
  // Logic
  return response.render("test");
});

module.exports = app;
