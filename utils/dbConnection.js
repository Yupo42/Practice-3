const mysql = require('mysql2');
const dbConnection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'guselnickov_login'
});
module.exports = dbConnection.promise();