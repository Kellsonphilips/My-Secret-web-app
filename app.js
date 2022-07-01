
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");




//////////////////Initailizing modules /////////////////////////

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//////////////////Initailizing express-session modules /////////////////////////

app.use(session({
    secret: "Just a little secret",
    resave: false,
    saveUninitialized: false
}));

//////////////////Initailizing passport modules /////////////////////////

app.use(passport.initialize());
app.use(passport.session());


///////////////////Mongoose Url connection///////////////////////

mongoose.connect(
  "mongodb+srv://kellsonphilips:Light45617398@firstcluster0.wft7b.mongodb.net/userDB",
  { useNewUrlParser: true }
);

///////////////////Creation of mongoose DB Schema////////////////////////

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//////////////////Initailizing passport-local-mongoose modules /////////////////////////

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

///////////////// Another Schema ///////////////////////////////////
const secretSchema = new mongoose.Schema ({
    secrets: String
});

//////////////////Creation of mongoose model ///////////////////////

const User = new mongoose.model("User", userSchema);

////////////////// Passport/Passport-Local Configuration /////////////////////////

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


///////////////// passport and google OAuth /////////////////////////////

passport.use( new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "https://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

///////////////// Another mongoose model /////////////////////////////
const Secret = new mongoose.model("Secret", secretSchema);

////////////// App routes ///////////////////////

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/logout", function(req, res) {
    req.logOut();
    res.redirect("/");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/submit", function (req, res) {
  res.render("submit");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});


//////////////////Creation of DB and user Athentications with bcrypt ////////////////

// app.post("/register", function(req, res) {

//     bcrypt.hash(req.body.password, 10, function (err, hash) {
//      const newUser = new User({
//        email: req.body.username,
//        password: hash,
//      });
//         newUser.save(function (err) {
//             if (!err) {
//                res.render("secrets");
//             } else {
//                console.log(err);
//             }
//         });
//     });

// });

//////////////////Creation of DB and user Athentications with passport //////////////////

app.post("/register", function(req, res) {
    
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err); 
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });
});


//////////////////////User login Authentication and password checks using bcrypt///////////////////

// app.post("/login", function(req, res) {

//     const requestedEmail = req.body.username;
//     const requestedPassword = req.body.password;

//     User.findOne({email: requestedEmail}, function(err, foundUser) {
//         if (err) {
//             console.log(err);
//         } else {
//             if (foundUser) {
//                 bcrypt.compare(requestedPassword, foundUser.password, function(err, result) {
//                     if (result == true) {
//                         res.render("secrets");
//                     } else {
//                         console.log(err);
//                     }        
//                 });  
//             }  
//         }
//     });
// });

//////////////////////User login Authentication and password checks using passport////////////////


app.post("/login", function(req, res) {

    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
               res.redirect("/secrets");
            });
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