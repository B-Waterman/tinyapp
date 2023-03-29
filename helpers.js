//Generate Random ID for Tiny URLs & Users
const generateRandomString = function() {
  let alphaNumString = "";
  alphaNumString += Math.random().toString(36).substring(1, 8);
  return alphaNumString;
};

//Find registered user in users object via email
const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  } return false;
};

//Users can only see/manipulate/access URLs created under their id
const urlsForUser = function(userID, urlDatabase) {
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