require('dotenv').config()
var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

	// Your password
  password: process.env.PASSWORD,
  database: "employee_db"
});

connection.connect(function(err) {
  if (err) throw err;
  
});

module.exports = connection;