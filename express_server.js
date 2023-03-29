const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bcrypt = require("bcryptjs");

// const cookieSession = require("cookie-session");
// app.use(cookieSession({
//   name: 'session',
//   keys: ['aBeautifulPattern', 'key2']
// }));


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
    const urlObject = urlDatabase[id]
    console.log("urlsForUser", urlObject, userID);
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
  const userID = req.cookies.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect("/urls");
  }
  res.redirect('/login');
});


//URLs - Saved to Session, Main Page
app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  console.log("userID", userID);
  const user = users[userID];
  if (!user) {
    return res.send("Error: line 108! Users must be <a href = '/login'>logged in</a> to create TinyUrls!");
  }
  const urls = urlsForUser(userID);
  const templateVars = { user, urls };

  res.render("urls_index", templateVars);
});

//Create a New Tiny Url - MUST STAY ABOVE /URLS/:ID Definitions
app.get("/urls/new", (req, res) => {
  const id = req.cookies["user_id"];
  const user = users[id];
  if (!user) {
    return res.redirect("/login");
  }
  const urls = urlsForUser(user);
  const templateVars = { user, urls };
  res.render("urls_new", templateVars);
});

//New Page/ URL Show
app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if (!userID || !user) {
    return res.status(401).send("Error: line 133! Users must be <a href = '/login'>logged in</a> to continue.")
  }
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  console.log("New url Added", longURL);
  if (urlDatabase[id].userID !== user.id) {
    return res.status(401).send("Sorry, only the user who created this TinyUrl may edit its contents! Please <a href = '/login'>log in</a> to continue.")
  }

  const templateVars = { id, longURL, user };
  console.log("templateVars 144", templateVars);

  res.render("urls_show", templateVars);
});

//Redirects to corresponding long URL from database
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL); //Does this need userID too? test
});

//Generates short URL & Saves to Database
app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if (!user) {
    return res.send("Error: line 158! Users must be <a href = '/login'>logged in</a> to create TinyUrls!");
  }
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = { longURL, userID }; //saves key-value pair to urlDatabase
  res.redirect(`/urls/${id}`);

  console.log("New URL Added:", urlDatabase)
});

//Redirects client to /urls once Tiny URL is edited and saved to database
app.post("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if (!user) {
    return res.send("Error: line 173! Users must be <a href = '/login'>logged in</a> to delete TinyUrls!");
  }
  const urls = urlsForUser(user);
  if (!urls) {
    return res.send("Sorry, only the user who created this TinyUrl may edit its contents!"); //add a return hyperlink to /urls here
  }
  
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL; //check this is working as intended with edits
  res.redirect("/urls");
});

//Delete Saved URLs from Server
app.post("/urls/:id/delete", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const urls = urlsForUser(user);
  if (urlDatabase[id].userID === user.id) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
  res.send("Error: line 195! Only authorized users may delete TinyUrls! Please <a href = '/login'>log in</a> to continue!");
});


//LOGIN

//GET: shows login page
app.get("/login", (req, res) => {
  const userID = req.cookies.user_id;
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
  console.log("registeredUser", registeredUser);
  // req.cookies.user_id = registeredUser.id;
  res.cookie('user_id', registeredUser.id);
  res.redirect("/urls");
  
});

//REGISTER

//Shows registration page
app.get("/register", (req, res) => {
  const userID = req.cookies.user_id;
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
  req.cookies.user_id = id;
  res.redirect("/urls");
});

//LOGOUT

//removes user cookie and redirects to /login page
app.post("/logout", (req, res) => {
  req.cookies["user_id"] = null;
  res.redirect("/login");
});

//APP.LISTEN

app.listen(PORT, error => {
  (error ? console.log("Server Error, Cannot Start TinyApp") : console.log(`TinyApp listening on port ${PORT}!`));
});