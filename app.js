const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://folk2541:019968078@cluster0.bn4cc.mongodb.net/blogWeb?retryWrites=true&w=majority"
);
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
});
const Blog = mongoose.model("Blog", blogSchema);

app.get("/favicon.ico", (req, res) => res.status(204));

app.get("/", function (req, res) {
  Blog.find(function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.render("index", { result: result });
    }
  });
});
app.get("/create", function (req, res) {
  res.render("create");
});

app.get("/:blogTitle", function (req, res) {
  const blogTitle = req.params.blogTitle;
  console.log(blogTitle);
  Blog.findOne({ title: blogTitle }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      // console.log(result);
      res.render("post", { result: result });
    }
  });
});

app.post("/create", function (req, res) {
  const reqTitle = req.body.title;
  const reqContent = req.body.content;
  const blog = new Blog({
    title: reqTitle,
    content: reqContent,
  });
  blog.save(function () {
    res.redirect("/");
  });
});
app.post("/delete", function (req, res) {
  titleDelete = req.body.delete;
  Blog.findOneAndRemove({ title: titleDelete }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });
