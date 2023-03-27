const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");


//DATABASES

//User(s) Registration

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "Blah-the-Blah",
  }
};

//URL Database

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//Helper Function

//Generate Random ID for Tiny URLs & Users
function generateRandomString() {
  const alphaNumString = "";
  alphaNumString += Math.random().toString(36).substring(1, 8);
  return alphaNumString;
}

//Find registered user in users object via email
//email as param, return entire object OR if no? return null
const findUserEmail = (email) => {
  const values = Object.values(users);
  for (const user of values) {
    if (user.email === email) {
      return user;
    }
  }
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
  const userObject = req.cookies.user_id;
  const templateVars = { user: userObject, urls: urlDatabase };
  if (!userObject) {
    return res.send("Hi there! Users must be <a href = '/login'>logged in</a> to create TinyUrls!")
  }
  res.render("urls_index", templateVars);
});

//Create a New Tiny Url - MUST STAY ABOVE /URLS/:ID Definitions
//Generates short URL & Saves to Database
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const userObject = req.cookies.user_id;
  if (!userObject) {
    return res.send("Hi there! Users must be <a href = '/login'>logged in</a> to create TinyUrls!")
  }
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  const userObject = req.cookies.user_id;
  const templateVars = { user: userObject, urls: urlDatabase };
  if (!userObject) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//New Page/ URL Show
app.get("/urls/:id", (req, res) => {
  const userObject = req.cookies.user_id;
  const templateVars = { user: userObject, id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

//Redirects to corresponding long URL from database
app.get("/u/:id", (req, res) => {
  const userObject = req.cookies.user_id;
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL, userObject);
});

//Redirects client to /urls once Tiny URL is edited and saved to database
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.newUrl;
  res.redirect("/urls");
});

//Delete Saved URLs from Server
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


//LOGIN

//GET: shows login page
app.get("/login", (req, res) => {
  const userObject = req.cookies.user_id;
  const templateVars = { user: userObject };
  if (!userObject) {
    return res.render("login", templateVars);
  }
  res.redirect("/urls");
});

//POST: creates user cookie and redirects to /urls as named user-session
app.post("/login", (req, res) => {
  const registeredUser = findUserEmail(req.body.email);
  if (registeredUser === null) {
    res.status(403);
    return res.send("Hold on, you're not registered yet! Please return to the homepage and register by email.");
  }

  if (users[registeredUser].password !== req.body.password) {
    res.status(403);
    return res.send("Incorrect password. Please re-try.");
  }
  res.cookie("user_id", registeredUser);
  res.redirect("/urls");
  
});

//REGISTER

//Shows registration page
app.get("/register", (req, res) => {
  const userObject = req.cookies.user_id;
  const templateVars = { user: userObject };
  if (!userObject) {
    return res.render("user_registration", templateVars);
  }
  res.redirect("/urls");
});

//Register new user to Users database

//check if email & password are empty strings = error 400
//check if email already reg'd, = 400
app.post("/register", (req, res) => {
  const registeredUser = findUserEmail(req.body.email);
  if (registeredUser !== null) {
    res.status(400);
    return res.send("User email already registered; please login, or register with another email address.");
  }
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    return res.send("Email or Password field empty. Please enter a valid email or password.");
  }
  
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", userID);
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