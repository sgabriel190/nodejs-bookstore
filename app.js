const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const app = express();
const port = 6789;

const listaIntrebari = [{
        intrebare: 'Sunteti pasionat de carti?',
        variante: ['Da', 'Nu', 'Citesc ocazional'],
        corect: 0
    },
    {
        intrebare: 'Ati achizitionat carti de pe site-ul nostru?',
        variante: ['Da', 'Nu'],
        corect: 1
    },
    {
        intrebare: 'Cate ore pe saptamana alocati cititului?',
        variante: ['Intre 1-2 ore', 'Intre 2-4 ore', 'Deloc', 'Nici una din variantele de mai sus'],
        corect: 2
    }
];

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');

// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);

// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'));

// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());

// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => res.send('Hello World'));

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {

    // în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
    res.render('chestionar', { intrebari: listaIntrebari });
});

app.post('/rezultat-chestionar', (req, res) => {
    res.render('rezultat-chestionar', { raspunsuri: req.body, intrebari: listaIntrebari });
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));