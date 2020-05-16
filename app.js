const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const sessionModule = require("express-session");
const sqlite3 = require("sqlite3").verbose();
let bookDB = [];

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
    let sql_cmd = `SELECT * FROM produse`;

    db_cumparaturi.serialize(() => {
        db_cumparaturi.all(sql_cmd, [], (err, rows) => {
            if (err) {
                return console.log(err.message);
            }
            bookDB = rows;
            console.log("Selectare date din tabelul produse.");
        });
    });
    res.render("index", { bookDB: bookDB });
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
    let sql_cmd = `CREATE TABLE produse(
        name TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT NOT NULL,
        genre TEXT
    )`;
    let sql_cmd2 = "DROP TABLE IF EXISTS produse";
    db_cumparaturi.serialize(() => {
        db_cumparaturi.run(sql_cmd2, (err) => {
            if (err) {
                return console.log(err.message);
            }
            console.log("Tabelul produse a fost sters.");
        })
        db_cumparaturi.run(sql_cmd, (err) => {
            if (err) {
                return console.log(err.message);
            }
            console.log("Tabelul produse a fost creat.");
        });
    });

    res.redirect("http://localhost:6789/");
});

app.get("/inserare-bd", (req, res) => {
    let bookRecords = [
        ["Arta subtila a nepasarii", "Mark Manson", "978-606-789-109-6", "Lifestyle"],
        ["The economics book", "DK", "978-140-937-641-5", "Economics"],
        ["Pacienta tacuta", "Alex Michaelides", "978-606-333-606-5", "Fiction"],
        ["Pride and Prejudice", "Jane Austen", "978-178-487-172-7", "Novel"],
    ];
    let bookPlaceholders = bookRecords.map(() => "(?, ?, ?, ?)").join(', ');
    flatBooks = []
    let sql_cmd = `INSERT INTO produse (name, author, isbn, genre) 
                    VALUES ` + bookPlaceholders;
    bookRecords.forEach((elem) => {
        elem.forEach((item) => {
            flatBooks.push(item);
        });
    });
    db_cumparaturi.serialize(() => {
        db_cumparaturi.run(sql_cmd, flatBooks, (err) => {
            if (err) {
                return console.log(err.message);
            }
            console.log("Date inserate tabela produse.");
        });
    });
    res.redirect("http://localhost:6789/");
});

app.get("/vizualizare-cos", (req, res) => {

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

app.post("/adaugare-cos", (req, res) => {

});