require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { all } = require("express/lib/application");
const flash = require("connect-flash");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "Our little secretasdsa",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect(
  "mongodb+srv://folk2541:"+process.env.DB+"@cluster0.bn4cc.mongodb.net/blogweb?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
  }
);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  post: Array,
});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.get("/favicon.ico", (req, res) => res.status(204));

app.get("/", function (req, res) {
  let allPost = [];

  User.find(function (err, result) {
    result.forEach((element) => {
      let author = element.name;
      let post = element.post;

      post.forEach((element) => {
        const elements = { ...element, author };

        allPost.push(elements);
      });
    });
    res.render("index", { allPost: allPost });
  });
});

app.get("/create", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({ username: req.user.username }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("create", { name: result.name });
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/login", function (req, res) {
  let message = req.flash("error");
  res.render("login", { message: message });
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/homesecret", function (req, res) {
  const allPost = [];

  if (req.isAuthenticated()) {
    User.findOne({ username: req.user.username }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        let name = result.name;
        User.find(function (err, result) {
          result.forEach((element) => {
            let author = element.name;
            let post = element.post;

            post.forEach((element) => {
              let elements = { ...element, author };
              allPost.push(elements);
            });
          });
          res.render("homesecret", { name: name, allPost: allPost });
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/mypost", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({ username: req.user.username }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        let mypost = result.post;
        res.render("mypost", { name: result.name, mypost: mypost });
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
app.get("/posts/:blogTitle", function (req, res) {
  if (req.isAuthenticated()) {
    const blogTitle = req.params.blogTitle;
    User.findOne(
      { post: { $elemMatch: { reqTitle: blogTitle } } },
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
          let name = result.name;
          const post = result.post;

          post.forEach((element) => {
            if (element.reqTitle === blogTitle) {
              const resultPost = {
                title: element.reqTitle,
                content: element.reqContent,
              };
              User.findOne(
                { username: req.user.username },
                function (err, result) {
                  if (err) {
                    console.log(err);
                  } else {
                    const mypost = result.post;
                    res.render("postsecret", {
                      result: resultPost,
                      name: result.name,
                      postname: name,
                    });
                  }
                }
              );
            }
          });
        }
      }
    );
  } else {
    var name = "";
    const blogTitle = req.params.blogTitle;
    User.findOne(
      { post: { $elemMatch: { reqTitle: blogTitle } } },
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
          name = result.name;
          const post = result.post;

          post.forEach((element) => {
            if (element.reqTitle === blogTitle) {
              const resultPost = {
                title: element.reqTitle,
                content: element.reqContent,
              };

              res.render("post", { result: resultPost, name: name });
            }
          });
        }
      }
    );
  }
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
      })(req, res, function () {
        if (!req.isAuthenticated()) {
          res.redirect("/login");
        } else {
          res.redirect("/homesecret");
        }
      });
    }
  });
});
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local", {
          failureRedirect: "/register",
          failureFlash: true,
        })(req, res, function () {
          const name = req.body.name;
          User.findOneAndUpdate(
            { username: req.body.username },
            { name: name },
            function (err, result) {
              if (err) {
                console.log(err);
                res.redirect("/register");
              }
            }
          );
          res.redirect("/homesecret");
        });
      }
    }
  );
});

app.post("/create", function (req, res) {
  const reqTitle = req.body.title;
  const reqContent = req.body.content;
  const posts = { reqTitle, reqContent };

  if (req.isAuthenticated()) {
    User.findOneAndUpdate(
      { username: req.user.username },
      { $push: { post: posts } },
      function (err, result) {
        if (err) {
          console.log(err);
        }
      }
    );
    res.redirect("/homesecret");
  } else {
    res.redirect("/login");
  }
});
app.post("/delete", function (req, res) {
  titleDelete = req.body.delete;

  if (req.isAuthenticated()) {
    User.findOneAndUpdate(
      { username: req.user.username },
      { $pull: { post: { reqTitle: titleDelete } } },

      function (err, result) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/mypost");
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);

