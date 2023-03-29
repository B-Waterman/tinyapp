//Generate Random ID for Tiny URLs & Users
const generateRandomString = function() {
  let alphaNumString = "";
  alphaNumString += Math.random().toString(36).substring(1, 8);
  return alphaNumString;
};

//Find registered user in users object via email
const getUserByEmail = function(email, users) {
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

module.exports = { generateRandomString, getUserByEmail, urlsForUser };