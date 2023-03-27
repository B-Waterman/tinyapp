const express = require("express");
const app = express();
const PORT = 8090; // default port 8080
const bcrypt = require("bcryptjs");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");


//DATABASES

//User(s) Registration

const users = {};

//URL Database

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.com",
    userID: "userRandomID",
  },
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//Helper Function

//Generate Random ID for Tiny URLs & Users
const generateRandomString = function() {
  let alphaNumString = "";
  alphaNumString += Math.random().toString(36).substring(1, 8);
  return alphaNumString;
};

//Find registered user in users object via email
//email as param, return entire object OR if no? 
const findUserEmail = function(email) {
  const values = Object.values(users);
  for (const user of values) {
    if (user.email === email) {
      return user;
    }
  }
};

//Users can only see/manipulate/access URLs created under their id
const urlsForUser = function(userID) {
  const urls = {};

  const ids = Object.keys(urlDatabase);
  for (const id of ids) {
    const urlObject = urlDatabase[id];
    if (urlObject.userID === userID) {
      urls[id] = urlObject;
    }
  }
  return urls;
};

// ROUTES

//Tester
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World</b></body></html>\n");
});

//Redirects to main page
app.get("/", (req, res) => {
  res.redirect("/urls");
});


//URLs - Saved to Session, Main Page

app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (!user) {
    return res.send("Hi there! Users must be <a href = '/login'>logged in</a> to create TinyUrls!")
  }
  const urls = urlsForUser(userID);

  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

//Create a New Tiny Url - MUST STAY ABOVE /URLS/:ID Definitions
app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = { urls, user };
  res.render("urls_new", templateVars);
});

//New Page/ URL Show
app.get("/urls/:id", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: userID };
  res.render("urls_show", templateVars);
});

//Redirects to corresponding long URL from database
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

//Generates short URL & Saves to Database
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (!user) {
    return res.send("Hi there! Users must be <a href = '/login'>logged in</a> to create TinyUrls!")
  }
  urlDatabase[id] = { longURL: req.body.longURL, userID };
  res.redirect(`/urls/${id}`);
});

//Redirects client to /urls once Tiny URL is edited and saved to database
app.post("/urls/:id", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (!user) {
    return res.send("Hi there! Users must be <a href = '/login'>logged in</a> to delete TinyUrls!")
  }
  const urls = urlsForUser(userID);
  if (!urls) {
    return res.send("Sorry, looks like these TinyUrls don't belong to your account!")
  }
  
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

//Delete Saved URLs from Server
app.post("/urls/:id/delete", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (!user) {
    return res.send("Hi there! Users must be <a href = '/login'>logged in</a> to delete TinyUrls!")
  }

  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});


//LOGIN

//GET: shows login page
app.get("/login", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: userID };
  if (!userID) {
    return res.render("login", templateVars);
  }

  res.redirect("/urls");
});

//POST: creates user cookie and redirects to /urls as named user-session
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;


  const registeredUser = findUserEmail(email);
  if (registeredUser === null) {
    res.status(403);
    return res.send("Hold on, you're not registered yet! Please return to the homepage and <a href = '/register'>register</a> by email.");
  }

  if (!registeredUser || !bcrypt.compareSync(password, registeredUser.password)) {
    res.status(403);
    return res.send("Invalid login. Please <a href = '/login'>retry</a>.");
  }
  console.log(registeredUser.password);
  res.cookie("user_id", registeredUser.id);
  res.redirect("/urls");
  
});

//REGISTER

//Shows registration page
app.get("/register", (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = { user: userID };
  if (!userID) {
    return res.render("user_registration", templateVars);
  }
  
  res.redirect("/urls");
});

//Register new user to Users database

//check if email & password are empty strings = error 400
//check if email already reg'd, = 400
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (!email || !password) {
    res.status(400);
    return res.send("Email or Password field empty. Please enter a valid email or password.");
  }
  if (findUserEmail(email)) {
    res.status(400);
    return res.send("This email is already registered; please <a href = '/login'>login</a>, or <a href = '/register'>register</a> with another email address.");
  }
  const id = generateRandomString();
  users[id] = { id, email, password: bcrypt.hashSync(password, 10) };
  
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//LOGOUT

//removes user cookie and redirects to /login page
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

//APP.LISTEN

app.listen(PORT, error => {
  (error ? console.log("Server Error, Cannot Start TinyApp") : console.log(`TinyApp listening on port ${PORT}!`));
});