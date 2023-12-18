const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
const cors = require("cors");
const saltRounds = 10; // Number of salt rounds for bcrypt

// Configure Express to parse JSON and URL-encoded body

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
// Connect to MongoDB (replace 'mongodb://localhost:27017/your-database-name' with your database URI)
mongoose
  .connect("mongodb://127.0.0.1:27017/BloggingPlatform", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Define a User schema
const userSchema = new mongoose.Schema({
  userId: String, // User ID field
  username: String,
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  contactInfo: String,
});

// Create a User model based on the schema
const User = mongoose.model("User", userSchema);

// Define Blog Post schema and model
const blogPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  userId: {
    type: mongoose.Schema.Types.String,
    ref: "User", // Reference to the User model
  },
  publicationDate: Date,
  lastModifiedDate: Date,
  likesCount: Number,
  commentsCount: Number,
  tags: [String],
  comments: [String],
  status: String, // e.g., draft, published
});
const BlogPost = mongoose.model("BlogPost", blogPostSchema);

// Serve static files (HTML, CSS, etc.)
app.use(express.static("public"));

// Define a route to serve the registration form
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/registration.html"); // Serves the user registration form
});

// Handle user registration
app.post("/register", async (req, res) => {
  try {
    // Hash and salt the password using bcrypt
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Create a new user
    const newUser = new User({
      userId: req.body.userId, // User ID from the form
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      contactInfo: req.body.contactInfo,
    });

    // Save the user to the database
    await newUser.save();

    // After successful registration, redirect to the blog post creation page
    res.redirect("/create-blog-post");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred during registration.");
  }
});

// Create a new blog post route (GET)
app.get("/create-blog-post", (req, res) => {
  // You can render an HTML page here for creating a blog post or handle the logic as needed.
  // For example, you can serve an HTML form for creating a blog post.
  res.sendFile(__dirname + "/create-blog-post.html");
});

// Create a new blog post route (POST)
app.post("/create-blog-post", async (req, res) => {
  try {
    // Create a new blog post
    const newBlogPost = new BlogPost({
      title: req.body.title,
      content: req.body.content,
      userId: req.body.userId, // Use the user-entered user ID
      images: req.body.images
        ? req.body.images.split(",").map((image) => image.trim())
        : [],
      videos: req.body.videos
        ? req.body.videos.split(",").map((video) => video.trim())
        : [],
      tags: req.body.tags
        ? req.body.tags.split(",").map((tag) => tag.trim())
        : [],
      publicationDate: new Date(),
      lastModifiedDate: new Date(),
      likesCount: 0,
      commentsCount: 0,
      status: req.body.status,
    });

    // Save the blog post to the database
    await newBlogPost.save();
    // dislay alert if blog post is created successfully
    res.send(
      "<script>alert('Blog Post Created Successfully!');window.location = '/blog-posts'</script>",
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(`An error occurred while creating the blog post: ${error.message}`);
  }
});

app.get("/blog-posts", (req, res) => {
  res.sendFile(__dirname + "/display-blog-post.html");
});

// make get endpoint the reuturns all blog posts
app.get("/all-blog-posts", async (req, res) => {
  try {
    // Get all blog posts from the database
    const blogPosts = await BlogPost.find();
    res.send(blogPosts);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting blog posts.");
  }
});

// make a get endpoint that uses a url parameter `post_id` to delete a blog post
app.get("/delete-blog-post/:post_id", async (req, res) => {
  try {
    // Get all blog posts from the database
    await BlogPost.findByIdAndDelete(req.params.post_id);
    // send a success message if the blog post is deleted successfully
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting blog posts.");
  }
});

// make a get endpoint that takes a url parameter `post_id` and content query as the new content
app.get("/update-blog-post/:post_id", async (req, res) => {
  try {
    // Get all blog posts from the database
    await BlogPost.findByIdAndUpdate(req.params.post_id, {
      content: req.query.content,
    });
    // send a success message if the blog post is updated successfully
    res.json({ message: "Blog post updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting blog posts.");
  }
});

// make get endpoint that takes a url parament `post_id` and add a comment to the blog post and comment query
app.get("/add-comment/:post_id", async (req, res) => {
  try {
    // Get all blog posts from the database
    await BlogPost.findByIdAndUpdate(req.params.post_id, {
      $push: { comments: req.query.comment },
    });
    // send a success message if the blog post is updated successfully
    res.json({ message: "Comment added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting blog posts.");
  }
});

// make a get a endpoint that takes a url parameter `post_id` and makes the comments of the blog post empty
app.get("/delete-comments/:post_id", async (req, res) => {
  try {
    // Get all blog posts from the database
    await BlogPost.findByIdAndUpdate(req.params.post_id, {
      $set: { comments: [] },
    });
    // send a success message if the blog post is updated successfully
    res.json({ message: "Comments deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while getting blog posts.");
  }
});
// Start the server on port 3000
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
