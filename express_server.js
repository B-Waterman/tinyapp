const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");


//Helper Function

//Generate Random ID for Tiny URLs & Users
function generateRandomString() {
  let alphaNumString = "";
  alphaNumString += Math.random().toString(36).substring(1, 8);
  return alphaNumString;
}


//DATABASES

//SUGGESTED TEMPLATE User(s) Registration

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

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// ROUTES

//Testers

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World</b></body></html>\n");
});

//Shows registration page

app.get("/register", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("user_registration", templateVars);
});

//URLs - Saved to Session, Main Page

app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//Create a New Tiny Url - MUST STAY ABOVE /URLS/:ID Definitions

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

//Generates short URL & Saves to Database

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL; //saves key-value pair to urlDatabase then redirects
  res.redirect(`/urls/${id}`);
});

//New Page/ URL Show

app.get("/urls/:id", (req, res) => {
  let templateVars = { username: req.cookies["username"], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

//Redirects to corresponding long URL from database

app.get("/u/:id", (req, res) => {
  let templateVars = req.cookies["username"]
  let longURL = urlDatabase[req.params.id];
  res.redirect(longURL, templateVars);
});

//Delete Saved URLs from Server

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//Redirects client to /urls once Tiny URL is edited and saved to database

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.newUrl;
  res.redirect("/urls");
});

//Register new user to Users database
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };
});

//Login: creates username cookie and redirects to /urls as named user-session
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

//Logout: removes username cookie and redirects to /urls as no-user session
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

//APP.LISTEN

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});