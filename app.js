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
        console.log("[DB-info]:Connected to the cumparaturi database.");
    });

const app = express();
const port = 6789;

// Citirea fisierelor
const fs = require("fs");
const intrebari_raw = fs.readFileSync("intrebari.json");
const utilizatori_raw = fs.readFileSync("utilizatori.json");

// Parsarea continutui fisierelor intr-un obiect JSON
const json_utilizatori = JSON.parse(utilizatori_raw);
const json_intrebari = JSON.parse(intrebari_raw);

//Adaugarea modulului session in aplicatie
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
    console.log("[Server-info]Serverul rulează la adresa http://localhost:")
);

// GET methods
app.get("/admin", (req, res) => {
    if (req.session.admin_user == "admin" && req.session.admin_pass == "admin") {
        res.render("admin");
    } else {
        res.redirect("admin-login");
    }
});

app.get("/admin-login", (req, res) => {
    res.render("admin-login");
});

app.get("/", (req, res) => {
    res.locals.utilizator = req.session.utilizator;
    let sql_cmd = `SELECT * FROM produse`;
    let bookDB = [];

    let promise = new Promise((resolve, reject) => {
        db_cumparaturi.serialize(() => {
            db_cumparaturi.all(sql_cmd, [], (err, rows) => {
                if (err) {
                    reject(err.message);
                }
                bookDB = rows;
                console.log("[DB-info]:Selectare date din tabelul produse.");
                resolve();
            });
        });
    });

    promise.then(() => {
        res.render("index", { bookDB: bookDB });
    }).catch(err => console.log(err));
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
        id INTEGER NOT NULL PRIMARY KEY,
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
            console.log("[DB-info]:Tabelul produse a fost sters.");
        })
        db_cumparaturi.run(sql_cmd, (err) => {
            if (err) {
                return console.log(err.message);
            }
            console.log("[DB-info]:Tabelul produse a fost creat.");
        });
    });
    res.redirect("http://localhost:6789/");
});

app.get("/inserare-bd", (req, res) => {
    let bookRecords = [
        [1, "Arta subtila a nepasarii", "Mark Manson", "978-606-789-109-6", "Lifestyle"],
        [2, "The economics book", "DK", "978-140-937-641-5", "Economics"],
        [3, "Pacienta tacuta", "Alex Michaelides", "978-606-333-606-5", "Fiction"],
        [4, "Pride and Prejudice", "Jane Austen", "978-178-487-172-7", "Novel"],
    ];
    let bookPlaceholders = bookRecords.map(() => "(?, ?, ?, ?, ?)").join(', ');
    flatBooks = []
    let sql_cmd = `INSERT INTO produse (id, name, author, isbn, genre) 
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
            console.log("[DB-info]:Date inserate tabela produse.");
        });
    });
    res.redirect("http://localhost:6789/");
});

app.get("/vizualizare-cos", (req, res) => {
    var lista_carti = [];
    var listaCumparaturiID = req.session.listaCos;
    var getBookFunction = (id) => {
        return new Promise((resolve, reject) => {
            var sql_cmd = `SELECT * FROM produse WHERE id=${id}`;
            db_cumparaturi.serialize(() => {
                db_cumparaturi.all(sql_cmd, [], (err, rows) => {
                    if (err) {
                        reject(err.message);
                    }
                    resolve(rows[0]);
                });
            });
        });
    };
    let promise = new Promise(async(resolve, reject) => {
        for (var i = 0; i < listaCumparaturiID.length; ++i) {
            await getBookFunction(listaCumparaturiID[i]).then((arg) => {
                    lista_carti.push(arg);
                })
                .catch(err => console.log(err));
        }
        resolve();
    });
    promise.then(() => {
        res.render("vizualizare-cos", { listaCumparaturi: lista_carti });
    });
});


// POST methods
app.post("/verificare-autentificare", (req, res) => {
    let raspuns_json = req.body;

    if (json_utilizatori.utilizatori.some(
            item => item.utilizator == raspuns_json.nume_utilizator && item.parola == raspuns_json.parola_utilizator
        )) {
        req.session.mesajEroare = null;
        req.session.utilizator = raspuns_json.nume_utilizator;
        req.session.listaCos = [];
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
    req.session.listaCos.push(req.body.id);

    res.redirect("http://localhost:6789/");
});

app.post("/verificare-admin", (req, res) => {
    req.session.admin_user = req.body.admin_user;
    req.session.admin_pass = req.body.admin_pass;
    res.redirect("admin");
});

app.post("/adauga-bd", (req, res) => {
    var sql_cmd = `INSERT INTO produse (id, name, author, isbn, genre) 
                    VALUES (?, ?, ?, ?, ?)`;

    db_cumparaturi.serialize(() => {
        db_cumparaturi.run(sql_cmd, [req.body.id_book,
            req.body.name_book,
            req.body.author_book,
            req.body.isbn_book,
            req.body.genre_book
        ], (err) => {
            if (err) {
                return console.log(err.message);
            }
            console.log("[DB-info]:Admin data inserat in tabela produse.");
        })
    });
    res.redirect("admin");
});