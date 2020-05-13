const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const sessionModule = require("express-session");
const sqlite3 = require("sqlite3").verbose();

let db_cumparaturi = new sqlite3.Database('./cumparaturi.db',
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log("Connected to the cumparaturi database.");
    });

const app = express();
const port = 6789;

// Citirea fisierelor
const fs = require("fs");
const intrebari_raw = fs.readFileSync("intrebari.json");
const utilizatori_raw = fs.readFileSync("utilizatori.json");

const json_utilizatori = JSON.parse(utilizatori_raw);
const json_intrebari = JSON.parse(intrebari_raw);


app.use(sessionModule({
    name: "pw",
    secret: "abc",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2,
        sameSite: true
    }
}));

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set("view engine", "ejs");

// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);

// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static("public"));

// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());

// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Maparea locatiilor website-ului
 */

app.listen(port, () =>
    console.log("Serverul rulează la adresa http://localhost:")
);

// GET methods
app.get("/", (req, res) => {
    res.locals.utilizator = req.session.utilizator;
    res.render("index");
});

app.get("/autentificare", (req, res) => {
    res.locals.utilizator = req.session.utilizator;
    res.locals.mesajEroare = req.session.mesajEroare;
    res.render("autentificare");
});

app.get("/chestionar", (req, res) => {
    res.locals.utilizator = req.session.utilizator;
    res.render("chestionar", { intrebari: json_intrebari });
});

app.get("/creare-bd", (req, res) => {
    let sql_cmd = `CREATE TABLE IF NOT EXISTS produse(
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT NOT NULL,
        genre TEXT
    )`;

    db_cumparaturi.run(sql_cmd);

    res.redirect("http://localhost:6789/");
});

app.get("/inserare-bd", (req, res) => {

    res.redirect("http://localhost:6789/");
});


// POST methods
app.post("/verificare-autentificare", (req, res) => {
    let raspuns_json = req.body;

    if (json_utilizatori.utilizatori.some(
            item => item.utilizator == raspuns_json.nume_utilizator && item.parola == raspuns_json.parola_utilizator
        )) {
        req.session.mesajEroare = null;
        req.session.utilizator = raspuns_json.nume_utilizator;
        res.redirect("http://localhost:6789/");
    } else {
        req.session.mesajEroare = "Datele introduse sunt incorecte.";
        req.session.utilizator = null;
        res.redirect("http://localhost:6789/autentificare");
    }
});

app.post("/rezultat-chestionar", (req, res) => {
    res.render("rezultat-chestionar", {
        raspunsuri: req.body,
        intrebari: json_intrebari,
        utilizator: req.session.utilizator
    });
});

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect("http://localhost:6789/autentificare");
        }
        res.clearCookie("pw");
        res.redirect("http://localhost:6789/");
    });
});