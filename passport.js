// Замените на ваши реальные ID и секреты   OAuth2
// Для Google и GitHub. Эти значения можно получить в настройках вашего приложения на соответствующих платформах.
const GOOGLEID = "заполните_ваш_ID_здесь";
const GITHUBID = "заполните_ваш_ID_здесь";
const GOOGLESECRET = "заполните_ваш_секрет_здесь";
const GITHUBSECRET = "заполните_ваш_секрет_здесь";

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const dbConnection = require('./utils/dbConnection'); // Импорт подключения к базе данных

passport.serializeUser((user, done) => {
    console.log('Serialized user:', user);
    done(null, user.id || user.sub); // Используем Google ID, если нет user.id
});

passport.deserializeUser((id, done) => {
    done(null, { id }); // Временно возвращаем объект с id
});

passport.use(new GoogleStrategy({
    clientID: GOOGLEID,
    clientSecret: GOOGLESECRET,
    callbackURL: "http://localhost:3000/auth/callback",
    passReqToCallback: true
},
    async (request, accessToken, refreshToken, profile, done) => {
        try {
            const [user] = await dbConnection.execute(
                "SELECT * FROM `users` WHERE `email` = ?",
                [profile.email]
            );

            if (user.length === 0) {
                // Если пользователь не найден, создаём нового
                const [result] = await dbConnection.execute(
                    "INSERT INTO `users`(`name`, `email`, `password`) VALUES(?,?,?)",
                    [profile.displayName, profile.email, ''] // Передаём пустую строку вместо null
                );
                return done(null, { id: result.insertId, ...profile });
            }

            // Если пользователь найден
            return done(null, user[0]);
        } catch (err) {
            console.error('Error in Google Strategy:', err);
            return done(err, null);
        }
    }
));

passport.use(new GitHubStrategy({
    clientID: GITHUBID,
    clientSecret: GITHUBSECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('GitHub profile:', profile);

            // Используем email или создаём фиктивный email
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;

            console.log('Email used:', email);

            const [user] = await dbConnection.execute(
                "SELECT * FROM `users` WHERE `email` = ?",
                [email]
            );

            if (user.length === 0) {
                // Если пользователь не найден, создаём нового
                const [result] = await dbConnection.execute(
                    "INSERT INTO `users`(`name`, `email`, `password`) VALUES(?,?,?)",
                    [profile.displayName || profile.username, email, '']
                );
                return done(null, { id: result.insertId, ...profile });
            }

            // Если пользователь найден
            return done(null, user[0]);
        } catch (err) {
            console.error('Error in GitHub Strategy:', err);
            return done(err, null);
        }
    }
));