require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const routes = require('./routes');
require('./passport'); // Подключение файла с настройками Passport
const passport = require('passport');
const app = express();
const PORT = 3000;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // Пробел между "view" и "engine"
app.use(express.urlencoded({ extended: false }));
app.use(session({
    name: 'session',
    secret: 'my_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600 * 1000, // 1 час
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);
app.use((err, req, res, next) => {
    console.error(err.stack); // Логирование ошибки
    res.status(500).send('Internal Server Error');
});
app.listen(PORT, () => console.log(`Server is runngin on port ${PORT}`));