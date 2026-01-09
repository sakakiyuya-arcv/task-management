const express = require('express');
const database = require("./config/database");
const methodOverride = require("method-override");
require("dotenv").config();
const systemConfig = require("./config/system");
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const clientRoutes = require("./routes/client/index-route");
const routes = require("./routes/admin/index-route");

database.connect();

const app = express();
app.use(methodOverride("_method"));
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");

app.use(cookieParser('secret'));
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 60000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.locals.prefixAdmin = systemConfig.prefixAdmin;
const dateOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh' 
}
app.locals.dateOptions = dateOptions;
app.use(express.static(`${__dirname}/public`));

// Routes
clientRoutes(app);
routes(app);

app.listen(port,() => {
    console.log(`Task Management app listening on port ${port}`);
});
