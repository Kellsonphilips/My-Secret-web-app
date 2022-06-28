
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;


//////////////////Initailizing modules /////////////////////////

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


///////////////////Mongoose Url connection///////////////////////

mongoose.connect(
  "mongodb+srv://localhost:27017/userDB",
  {useNewUrlParser: true}
);

///////////////////Creation of mongoose DB Schema////////////////////////

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secretSchema = new mongoose.Schema ({
    secrets: String
});

//////////////////Creation of mongoose model ///////////////////

const User = new mongoose.model("User", userSchema);

const Secret = new mongoose.model("Secret", secretSchema);

////////////// App routes ///////////////////////

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


//////////////////Creation of DB and user Athentications //////////////////////

app.post("/register", function(req, res) {

    bcrypt.hash(req.body.password, 10, function (err, hash) {
     const newUser = new User({
       email: req.body.username,
       password: hash,
     });
        newUser.save(function (err) {
            if (!err) {
               res.render("secrets");
            } else {
               console.log(err);
            }
        });
    });

});


//////////////////////User login Authentication and password checks///////////////////

app.post("/login", function(req, res) {

    const requestedEmail = req.body.username;
    const requestedPassword = req.body.password;

    User.findOne({email: requestedEmail}, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(requestedPassword, foundUser.password, function(err, result) {
                    if (result == true) {
                        res.render("secrets");
                    } else {
                        console.log(err);
                    }        
                });  
            }  
        }
    });
});

/////////////////// Post Creation and route ////////////////////////

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



/////////////////// Server side for app test //////////////////////

app.listen(3000, function() {
    console.log("Server is started on port: 3000")
});