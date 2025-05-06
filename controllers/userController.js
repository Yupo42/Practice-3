const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const dbConnection = require("../utils/dbConnection");
const passport = require('passport');

passport.serializeUser((user, done) => {
    done(null, user.id); // Сохраняем только идентификатор пользователя
});

passport.deserializeUser((id, done) => {
    // Здесь вы можете найти пользователя в базе данных по id
    done(null, { id }); // Временно возвращаем объект с id
});

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() || req.session.userID) {
        return next();
    }
    res.redirect('/login');
};

//HomePage
exports.homePage = async (req, res, next) => {
    if (!req.session.userID) {
        console.log('User is not logged in. Redirecting to login.');
        return res.redirect('/login');
    }

    try {
        const [row] = await dbConnection.execute("SELECT * FROM `users` WHERE `id`=?", [req.session.userID]);
        if (row.length !== 1) {
            return res.redirect('/logout');
        }
        res.render('home', {
            user: row[0]
        });
    } catch (e) {
        console.error('Error in homePage:', e);
        next(e);
    }
};
//RegisterPage
exports.registerPage = (req, res, next) => {
    res.render("register");
};
//UserRegistration
exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    const { body } = req;
    if (!errors.isEmpty()) {
        return res.render('register', {
            error: errors.array()[0].msg
        });
    }
    try {
        const [row] = await dbConnection.execute(
            "SELECT * FROM `users` WHERE `email` = ?", 
            [body._email]
        );
        if (row.length >= 1) {
            return res.render('register', {
                error: 'This email already in use.'
            });
        }
        const hashPass = await bcrypt.hash(body._password, 12);
        const [rows] = await dbConnection.execute(
            "INSERT INTO `users`(`name`, `email`, `password`) VALUES(?,?,?)",
            [body._name, body._email, hashPass]
        );
        if (rows.affectedRows !== 1) {
            return res.render('register', {
                error: 'Your registration has failed.'
            });
        }
        res.render("register", {
            msg: 'You have successfully registered.'
        });
    } catch (e) {
        next(e);
    }
};
// Login Page
exports.loginPage = (req, res, next) => {
    res.render("login");
};
// Login User
exports.login = async (req, res, next) => {
    const errors = validationResult(req);
    const { body } = req;
    if (!errors.isEmpty()) {
        return res.render('login', {
            error: errors.array()[0].msg
        });
    }
    try {
        const [row] = await dbConnection.execute(
            'SELECT id, NAME AS name, email, PASSWORD AS password FROM `users` WHERE `email` = ?',
            [body._email]
        );

        console.log('User data:', row[0]);
        console.log('Password from database:', row[0]?.password);

        if (row.length !== 1) {
            return res.render('login', {
                error: 'Invalid email address.'
            });
        }

        if (!row[0].password) {
            return res.render('login', {
                error: 'Password not found for this user.'
            });
        }

        if (!body._password) {
            return res.render('login', {
                error: 'Password is required.'
            });
        }

        const checkPass = await bcrypt.compare(body._password, row[0].password);
        if (checkPass === true) {
            req.session.userID = row[0].id; // Установка userID в сессию
            return res.redirect('/');
        }

        res.render('login', {
            error: 'Invalid password.'
        });
    } catch (e) {
        console.error('Login error:', e);
        next(e);
    }
};

