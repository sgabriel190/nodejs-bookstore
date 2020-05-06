const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const app = express();
const port = 6789;

const fs = require("fs");
const intrebari_raw = fs.readFileSync("intrebari.json");

const json_intrebari = JSON.parse(intrebari_raw);

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

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/autentificare", (req, res) => {
    res.render("autentificare");
});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get("/chestionar", (req, res) => {
    // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
    res.render("chestionar", { intrebari: json_intrebari });
});

app.post("/rezultat-chestionar", (req, res) => {
    res.render("rezultat-chestionar", {
        raspunsuri: req.body,
        intrebari: json_intrebari
    });
});

app.listen(port, () =>
    console.log(`Serverul rulează la adresa http://localhost:`)
);