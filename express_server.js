const express = require("express");
const app = express();
const PORT = 8090; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// const cookieParser = require("cookie-parser");

const bcrypt = require("bcryptjs");

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: 'session',
  keys: ['aBeautifulPattern', 'key2']
}));


//DATABASES

//User(s) Registration

const users = {
  userRandomID: {
    id: "aJ48lW",
    email: "user@example.com",
    password: bcrypt.hashSync("1234", 10)
  }
};
//URL Database

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
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


//GET/POST ROUTES

//Tester
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World</b></body></html>\n");
});

//Redirects to main page
app.get("/", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect("/urls");
  }
  res.redirect('/login');
});


//URLs - Saved to Session, Main Page
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.send("Hi there! I'm on line 106! Users must be <a href = '/login'>logged in</a> to create TinyUrls!");
  }
  const urls = urlsForUser(user);
  const templateVars = { user, urls };

  res.render("urls_index", templateVars);
});

//Create a New Tiny Url - MUST STAY ABOVE /URLS/:ID Definitions
app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect("/login");
  }
  const urls = urlsForUser(user);
  const templateVars = { user, urls };
  res.render("urls_new", templateVars);
});

//New Page/ URL Show
app.get("/urls/:id", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = { id: shortURL, longURL, user };

  res.render("urls_show", templateVars);
});

//Redirects to corresponding long URL from database
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL); //Does this need userID too? test
});

//Generates short URL & Saves to Database
app.post("/urls", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  if (user === undefined) {
    return res.send("Hi there! I'm on line 148! Users must be <a href = '/login'>logged in</a> to create TinyUrls!");
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, user }; //saves key-value pair to urlDatabase
  res.redirect(`/urls/${shortURL}`);
});

//Redirects client to /urls once Tiny URL is edited and saved to database
app.post("/urls/:id", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.send("Hi there! I'm on line 161! Users must be <a href = '/login'>logged in</a> to delete TinyUrls!");
  }
  const urls = urlsForUser(user);
  if (!urls) {
    return res.send("Sorry, only the user who created this TinyUrl may edit its contents!"); //add a return hyperlink to /urls here
  }
  
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL; //check this is working as intended with edits
  res.redirect("/urls");
});

//Delete Saved URLs from Server
app.post("/urls/:id/delete", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  const urls = urlsForUser(user);
  if (user && urls) {
    const shortURL = req.params.id;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
  res.send("Hi there! I'm on line 183! Only authorized users may delete TinyUrls! Please <a href = '/login'>log in</a> to continue!");
});


//LOGIN

//GET: shows login page
app.get("/login", (req, res) => {
  let userID = req.session.user_id;
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
  const registeredUser = findUserEmail(email);
  
  if (!registeredUser || !bcrypt.compareSync(password, registeredUser.password)) {
    return res.status(403).send("Invalid login. Please <a href = '/login'>retry</a>.");
  }
  req.session.user_id = registeredUser;
  res.redirect("/urls");
  
});

//REGISTER

//Shows registration page
app.get("/register", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  const templateVars = { user };
  if (!user) {
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
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10)
  };
  
  if (!email || !password) {
    return res.status(400).send("Email or Password field empty. Please enter a valid email or password.");
  }
  if (findUserEmail(email)) {
    return res.status(400).send("This email is already registered; please <a href = '/login'>login</a>, or <a href = '/register'>register</a> with another email address.");
  }
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