
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");



const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://kellsonphilips:Light45617398@firstcluster0.wft7b.mongodb.net/userDB",
  {useNewUrlParser: true}
);


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secretSchema = new mongoose.Schema ({
    secrets: String
});


const User = new mongoose.model("User", userSchema);

const Secret = new mongoose.model("Secret", secretSchema);


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {

  res.render("register");
});

app.get("/submit", function (req, res) {
  res.render("submit");
});

app.post("/register", function(req, res) {

    const newUser = new User ({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save(function(err) {
        if (!err) {
            res.render("secrets");
        } else {
            console.log(err);
        }
    });
});

app.post("/login", function(req, res) {

    const requestedEmail = req.body.username;
    const requestedPassword = md5(req.body.password);

    User.findOne({email: requestedEmail}, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser.password === requestedPassword) {
                res.render("secrets");
            }    
        }
    });
});

app.post("/submit", function(req, res) {

    const newSecret = new Secret ({
        secrets: req.body.secret
    });

    newSecret.save(function(err) {
        if (!err) {
            res.send("Your secrets are saved and safe.");
        } else {
            res.send("You have no secrets saved!")
        }
    });
});




app.listen(3000, function() {
    console.log("Server is started on port: 3000")
});