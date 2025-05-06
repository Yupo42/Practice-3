const router = require("express").Router();
const { body } = require("express-validator");
const passport = require('passport');

const {
    homePage,
    register,
    registerPage,
    login,
    loginPage,
} = require("./controllers/userController");

const ifNotLoggedin = (req, res, next) => {
    if (!req.session.userID) {
        return res.redirect('/login');
    }
    next();
};
const ifLoggedin = (req, res, next) => {
    if (req.session.userID) {
        return res.redirect('/');
    }
    next();
};

// Middleware для проверки аутентификации
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() || req.session.userID) {
        return next();
    }
    res.redirect('/login');
};

// Маршруты для стандартной аутентификации
router.get('/', ensureAuthenticated, homePage);
router.get("/login", ifLoggedin, loginPage);
router.post("/login",
    ifLoggedin,
    [
        body("_email", "Invalid email address")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        body("_password", "The Password must be of minimum 4 characters length")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    login
);
router.get("/signup", ifLoggedin, registerPage);
router.post(
    "/signup",
    ifLoggedin,
    [
        body("_name", "The name must be of minimum 3 characters length")
            .notEmpty()
            .escape()
            .trim()
            .isLength({ min: 3 }),
        body("_email", "Invalid email address")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        body("_password", "The Password must be of minimum 4 characters length")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    register
);

// Маршруты для Google OAuth
router.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

router.get('/auth/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        req.login(req.user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.redirect('/login');
            }
            req.session.userID = req.user.id || req.user.sub; // Сохраняем userID в сессии
            console.log('User logged in:', req.user);
            res.redirect('/');
        });
    }
);

// Маршрут для начала аутентификации через GitHub
router.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

// Маршрут для обработки callback от GitHub
router.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        req.login(req.user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.redirect('/login');
            }
            req.session.userID = req.user.id; // Сохраняем userID в сессии
            res.redirect('/');
        });
    }
);

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy(() => {
            res.redirect('/login');
        });
    });
});

module.exports = router;