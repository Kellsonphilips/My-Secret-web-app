
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
    password: String,
    googleId: String,
    secrets: String
});

//////////////////Initailizing passport-local-mongoose modules /////////////////////////

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


//////////////////Creation of mongoose model ///////////////////////

const User = new mongoose.model("User", userSchema);

////////////////// Passport/Passport-Local Configuration /////////////////////////

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


///////////////// passport and google OAuth /////////////////////////////

passport.use(new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile);

      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
    }
));

////////////// App routes ///////////////////////

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

//////// Successful authentication, redirect to secrets route. ///////////////

app.get("/auth/google/secrets", function(req, res) {
    passport.authenticate("google", {
        successRedirect: "/secrets",
        failureRedirect: "/login"
    }, function(err) {
        if (err) {
           console.log(err); 
        }
    });    
});


https: app.get("/login", function (req, res) {
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
  if (req.isAuthenticated) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.get("/secrets", function (req, res) {
 
    User.find({"secrets": {$exist: true}}, function (err, foundUsers) {
        if (!err) {
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            } else {
                console.log(err);
            }
        } 
    });
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
    const submittedtedSecret = req.body.secret;

   User.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secrets = submittedtedSecret;
                foundUser.save(function() {
                    res.redirect("/secrets");
                });
            }
        }
   });
});



/////////////////// Server side for app test //////////////////////

app.listen(3000, function() {
    console.log("Server is started on port: 3000")
});