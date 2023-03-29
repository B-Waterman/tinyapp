const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

const bcrypt = require('bcryptjs');

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');

//DATABASES

//User(s) Registration

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("1234", 10)
  }
};
//URL Database

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//GET/POST ROUTES

//Tester
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World</b></body></html>\n");
});

//Redirects to main page
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect("/urls");
  }
  res.redirect('/login');
});


//URLs - Saved to Session, Main Page
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  console.log("userID", userID);
  console.log("Total users object", users);
  const user = users[userID];
  if (!user) {
    return res.send("Users must be <a href = '/login'>logged in</a> to create TinyUrls!");
  }
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = { user, urls };

  res.render("urls_index", templateVars);
});

//Create a New Tiny Url - MUST STAY ABOVE /URLS/:ID Definitions
app.get("/urls/new", (req, res) => {
  const id = req.session["user_id"];
  const user = users[id];
  if (!user) {
    return res.redirect("/login");
  }
  const urls = urlsForUser(user, urlDatabase);
  const templateVars = { user, urls };
  res.render("urls_new", templateVars);
});

//New Page/ URL Show
app.get("/urls/:id", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  if (!userID || !user) {
    return res.status(401).send("Users must be <a href = '/login'>logged in</a> to continue.");
  }
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  console.log("New url Added", longURL);
  if (urlDatabase[id].userID !== user.id) {
    return res.status(401).send("Sorry, only the user who created this TinyUrl may edit its contents! Please <a href = '/login'>log in</a> to continue.");
  }
  
  const templateVars = { id, longURL, user };
  console.log("templateVars", templateVars);

  res.render("urls_show", templateVars);
});

//Redirects to corresponding long URL from database
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

//Generates short URL & Saves to Database
app.post("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  if (!user) {
    return res.send("Users must be <a href = '/login'>logged in</a> to create TinyUrls!");
  }
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = { longURL, userID }; //saves key-value pair to urlDatabase
  res.redirect(`/urls/${id}`);

  console.log("New URL Added:", urlDatabase);
});

//Redirects client to /urls once Tiny URL is edited and saved to database
app.post("/urls/:id", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  if (!user) {
    return res.send("Users must be <a href = '/login'>logged in</a> to delete TinyUrls!");
  }
  const urls = urlsForUser(user, urlDatabase);
  if (!urls) {
    return res.send("Sorry, only the user who created this TinyUrl may edit its contents!"); //add a return hyperlink to /urls here
  }
  
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id].longURL = longURL; //check this is working as intended with edits
  res.redirect("/urls");
});

//Delete Saved URLs from Server
app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  const urls = urlsForUser(user, urlDatabase);
  if (user && urls) {
    const id = req.params.id;
    delete urlDatabase[id];
    return res.redirect("/urls");
  }
  res.send("Only authorized users may delete TinyUrls! Please <a href = '/login'>log in</a> to continue!");
});


//LOGIN

//GET: shows login page
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect("/urls");
  }
  
  const templateVars = { user };
  res.render("login", templateVars);
});

//POST: creates user cookie and redirects to /urls as named user-session
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const registeredUser = getUserByEmail(email, users);
  
  if (!registeredUser || !bcrypt.compareSync(password, registeredUser.password)) {
    return res.status(403).send("Invalid login. Please <a href = '/login'>retry</a>.");
  }
  req.session.user_id = registeredUser.id;
  res.redirect("/urls");
  
});

//REGISTER

//Shows registration page
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = { user };
  if (!user) {
    return res.render("user_registration", templateVars);
  }
  
  res.redirect("/urls");
});

//Register new user to Users database
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10)
  };
  
  if (!email || !password) {
    return res.status(400).send("Email or Password field empty. Please enter a valid email or password.");
  }
  if (getUserByEmail(email, users)) {
    return res.status(400).send("This email is already registered; please <a href = '/login'>login</a>, or <a href = '/register'>register</a> with another email address.");
  }
  console.log("req.session post register", req.session.user_id);
  req.session.user_id = id;
  res.redirect("/urls");
});

//LOGOUT

//removes user cookie and redirects to /login page
app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/login");
});

//APP.LISTEN

app.listen(PORT, error => {
  (error ? console.log("Server Error, Cannot Start TinyApp") : console.log(`TinyApp listening on port ${PORT}!`));
});