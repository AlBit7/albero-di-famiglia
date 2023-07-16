/* SEZIONE API E DATI DB */

// qui si usano funzioni che si relazionano, mediante l'API,
// con il server Python e il relativo database

// eseguo appena viene caricato il JS
// carico il DB di nodi e di persone
function caricaDB() {
    
    // faccio una request fetch all server con l'API:
    api("https://alberodifamiglia.albit7.repl.co/api/intero")
        .then((risultato) => {
            
            // ora che ho il DB in formato testo (ris) lo codifico in JSON
            DB = JSON.parse(risultato)

            console.log(DB)
            graficaTuttoIlDB(DB)

            return DB
            
        }) // grafica i nodi e le relazioni
        .then((db) => {
            // parte di spostamento delle persone
            const draggables = document.querySelectorAll('.spostabile')
            
            draggables.forEach((draggable) => {
                draggable.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    
                    if (event.button === 0) { // premo il tasto sinistro
                    
                        const initialX = e.clientX;
                        const initialY = e.clientY;
                        const initialLeft = draggable.offsetLeft;
                        const initialTop = draggable.offsetTop;
                        
                        const onMouseMove = (e) => {
                            const dx = e.clientX - initialX;
                            const dy = e.clientY - initialY;
    
                            // aggiorno posizione della div
                            draggable.style.left = `${initialLeft + dx}px`;
                            draggable.style.top = `${initialTop + dy}px`;
                        };
                        
                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                            // aggiorno la relazione a fine spostamento
                            
                            // molto dispendioso di risorse
                            for (const ID_relazione in db.relazioni) 
                                graficaRelazione(db, ID_relazione)

                            // invio l'aggiornamento delle coordinate
                            var myHeaders = new Headers();
                            myHeaders.append("Content-Type", "application/json");

                            // capisco che nodo sto spostando
                            ID_nodo = ""
                            nodo = e.target.closest(".nodo")
                            if (nodo) 
                                ID_nodo = nodo.id.replace("-nodo", "") // la accorcio per togliere la parte "-nodo"
                            
                            var raw = JSON.stringify({
                                "persone": db.nodi[ID_nodo]["persone"],
                                "coordinate": {
                                    "x": draggable.style.left,
                                    "y": draggable.style.top
                                }
                            });
                            
                            var requestOptions = {
                                method: 'POST',
                                headers: myHeaders,
                                body: raw,
                                redirect: 'follow'
                            };
                            
                            fetch("https://alberodifamiglia.albit7.repl.co/api/update/nodo/" + ID_nodo, requestOptions)
                              .then(response => response.text())
                              .then(result => console.log(result.message))
                              .catch(error => console.log('error', error));
                            
                        };
                    
                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                        
                    } // tasto sinistro => sposto
                    
                });
                
            });
            

        }) // permette il loro spostamento
        .then(() => {

            // prendo tutte le div con classe persona
            const persone = document.querySelectorAll('.persona')

            // itero tutte quele div e metto un eventlistener
            persone.forEach((persona) => {
                persona.addEventListener('contextmenu', (e) => {
                    e.preventDefault()

                    // capisco che persona è stata selezionata per la modifica (la individuo con la variabile ID_persona)
                    ID_persona = ''
                    if (e.target.tagName === "DIV") ID_persona = e.target.id
                    else if (e.target.parentNode.tagName === "DIV") ID_persona = e.target.parentNode.id
                    
                    console.log(ID_persona + ' è stata selezionata per la modifica/aggiunta')

                    // converto dall'ID in html all'ID del db togliendo la parte -persona
                    ID_persona = ID_persona.replace("-persona", '')
                    
                    // funzione di aggiunta o di modifica
                    modificaPersona(ID_persona)
                    
                })
            })
            
        }) // click destro per modifica
        .catch((error) => {
            console.error('Si è verificato un errore durante la richiesta: ', error)
        }) // errore durante la richiesta

}

//----------------------------------------------------------

/* SEZIONE GRAFICATURA DEI DATI */

// qui si "traducono" i dati grafici alla mano (ricavati dalla sezione di prima) 

function graficaTuttoIlDB(db) {

    // parto dalla graficazione dei nodi:
    for (ID_nodo in db.nodi) // itero tutti i nodi presenti nel DB
        graficaNodo(db, ID_nodo)

    // ora grafico le relazioni
    for (const ID_relazione in db.relazioni) // itero tutte le relazioni presenti nel DB
        graficaRelazione(db, ID_relazione)
    
}

function graficaRelazione(db, ID_relazione) {

    // capisco quali nodi devo collegare
    ID_figlio = db.relazioni[`${ID_relazione}`].figlio + '-persona'
    ID_nodo_genitori = db.relazioni[`${ID_relazione}`].nodi[0] + '-nodo' // uso il primo elemento

    console.log('collego ' + ID_figlio + ' con ' + ID_nodo_genitori)

    // ricavo le posizioni del nodo genitoriale e del nodo persona del figlio
    coordinateNodoFiglio = prendiCoordinateDaIDOggetto(ID_figlio)
    coordinateNodoGenitori = prendiCoordinateDaIDOggetto(ID_nodo_genitori)
    
    // disegno la linea
    creaLineaSVG(coordinateNodoFiglio, coordinateNodoGenitori, ID_relazione)
    
}

function graficaNodo(db, ID_nodo) {

    ID_persone = db.nodi[`${ID_nodo}`]["persone"]
    coordinate = {
        "x": db.nodi[`${ID_nodo}`].coordinate.x,
        "y": db.nodi[`${ID_nodo}`].coordinate.y
    }
    
    // capire se il nodo è singolo o multiplo:
    if (ID_persone.length == 1) tipo = 'singolo'
    else tipo = 'multiplo'

    // creo il codice da inserire nell'HTML:
    ris = `<div class="nodo ${tipo} spostabile" id="${ID_nodo}-nodo" style="left: ${coordinate.x}; top: ${coordinate.y};">`
    for (i in ID_persone) // itero tutte le persone nel nodo
        ris += codiceGraficoPersona(db, ID_persone[i])
    ris += `</div>`

    // grafico in HTML nella div con id="albero"
    document.getElementById('albero').innerHTML += ris
    
}

function codiceGraficoPersona(db, ID_persona) {
    
    // capire se la persona è maschio o femmina:
    if (db.persone[`${ID_persona}`].genere == 'M') genere = 'maschio'
    else if (db.persone[`${ID_persona}`].genere == 'F') genere = 'femmina'
    else genere = ''

    // creo il codice da inserire nell'HTML:
    ris =  `<div class="persona ${genere}" id="${ID_persona}-persona">`
    ris += `<span>${db.persone[`${ID_persona}`].nome}</span></br><span>${db.persone[`${ID_persona}`].cognome}</span>`
    ris += `</div>`

    // ritorno il codice della persona generata
    return ris
    
}

//----------------------------------------------------------

/* SEZIONE BOTTONI/FUNZIONI AGGIUNTIVE */

// salvataggio dell'intero DB tramite una chiamata api al server
function salvaDB() {

    api("https://alberodifamiglia.albit7.repl.co/api/salva")
        .then(() => console.log("DB salvato correttamente"))
        .catch(() => console.log("Errore salvataggio!!"))
    
}

// eventlistener per il bottone di salvataggio
document.getElementById("saveButton").addEventListener("click", () => {
    console.log("Provo a salvare il DB ...")
    salvaDB()
})

// funzione per il bottone dell'invio dei dati modificati al server
// è possibile chiamarla solo se la relativa finestra della modifica di persona è aperta
function salvaDatiPersona(ID) {
    
    console.log("Provo a salvare i dati della persona: " + ID)

    // ricavo tutti i campi della persona prima di mandare l'update
    nome    = document.getElementById('nome').innerText
    cognome = document.getElementById('cognome').innerText
    genere  = document.getElementById('genere').innerText
    nato    = document.getElementById('nato').innerText.replace(/\//g, "")
    // per trovare tutti gli eventi in formato chiave: valore
    eventi = {}
    chiaviValori = document.querySelectorAll('.chiave, .valore')
    chiaviValori.forEach((e, indice) => {

        if (indice % 2 === 0) // quando sono ad una chiave
            eventi[e.innerText] = chiaviValori[indice + 1].innerText // immagazzino il valore
        
    })

    // creo l'oggetto persona da memorizzare con tanto di ID
    personaDaSalvare = {
        "nome": nome,
        "cognome": cognome,
        "nato": nato,
        "genere": genere,
        "eventi": eventi
    }

    console.log("tento di salvare la persona " + ID + ": \n" + JSON.stringify(personaDaSalvare))

    // li invio al server con la chiamata all'api
    var myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")
    requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(personaDaSalvare), // rendo l'oggetto un oggetto JSON inviabile
        redirect: 'follow'
    }
    fetch(`https://alberodifamiglia.albit7.repl.co/api/update/persona/${ID}`, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error))
    
    // ricarico le nuove informazioni nel sito però prima pulisco tutto
    document.getElementById('albero').innerHTML = ''
    caricaDB()
    
} 

// funzione che permette la modifica, a seguito del click destro, dei dettagli di una persona
function modificaPersona(ID) {
    
    initFinestra()
    
    // ricavo i dati della persona con una chiamata a funzione
    api(`https://alberodifamiglia.albit7.repl.co/api/persona/${ID}`)
        .then((datiPersona) => {

            // trasformo i dati in un oggetto JSON
            dati = JSON.parse(datiPersona)

            // trascrivo i dati sulla pagina HTML:
            info = document.getElementById('datiPersona')

            // nome, cognome e genere (sicuramente presenti)
            info.innerHTML = `
                <h1 style="padding-bottom: 50px;">
                    <span id="nome" contenteditable="true">${dati.nome}</span> <span contenteditable="true" id="cognome">${dati.cognome}</span>
                </h1>
                <p>genere: <span id="genere" contenteditable="true">${dati.genere}</span></p>
            `

            // aggiunta della data di nascita
            info.innerHTML += `
                <p>nascita: <span id="nato" contenteditable="true">${dati.nato.substr(0, 2)}/${dati.nato.substr(2, 2)}/${dati.nato.substr(4, 4)}</span></p>
                <p id="eta">età: ${calcolaTempoTrascorso(dati.nato)}</p>
            `
    
            // aggiungo la scritta Eventi
            info.innerHTML += '<h3 style="padding-bottom: 15px; padding-top: 20px;">Eventi</h3><table style="width: 100%; border-collapse: collapse;"><tbody id="corpo"> </tbody><tfoot id="footer"> </tfoot></table>'
            
            // controllo es esistono eventi/curiosità sulla persona
            if (dati.eventi != {}) {
                
                // aggiunta di tutti gli eventi/curiosità della persona
                for (evento in dati.eventi) { // itero tutti gli eventi
    
                    document.getElementById('corpo').innerHTML += `
                        <tr>
                            <td style="width: 50%; padding: 10px; border: 1px solid black;">
                                <div contenteditable="true" class="chiave">${evento}</div>
                            </td> 
                            <td style="width: 50%; padding: 10px; border: 1px solid black;">
                                <div contenteditable="true" class="valore">${dati.eventi[evento]}</div>
                            </td>
                        </tr>
                    `
                }
            }

            // aggiungo il pulsante del creare nuovo elemento:
            document.getElementById('footer').innerHTML += `
                <tr class="riga-aggiuntiva" style="background-color: lightgray; cursor: pointer;" onclick="aggiungiEvento('${ID}')">
                    <td colspan="2" style="padding: 5px; border: none; border-top: 1px solid black; text-align: center; border-radius: 0 0 5px 5px;">
                        <span style="display: inline-block; width:100%; border-radius: 50%; padding: 5px;">+</span>
                    </td>
                </tr>
            `

            // aggiungo il pulsante di salvataggio
            info.innerHTML += `
                <div class="contenitoreBottoni">
                    <button id="saveButton" class="round-button" onclick="salvaDatiPersona('${ID}')">
                        <i class="fas fa-save"></i>
                    </button>
                </div>
            ` // inserisco anche l'ID così che la funzione che si occupa di salvare i dati sa per quale persona salvarli
            
        }) // grafica tutti i dati
        .catch(error => console.log(`S'è verificato un errore chiedendo i dati di ${ID}: ${error}`))
    
}

//----------------------------------------------------------

/* FUNZIONI UTILITARIE */

// funzione complementare a modificaPersona
function aggiungiEvento() {

    // grafico la nuova riga della tabella
    document.getElementById('corpo').innerHTML += `
        <tr>
            <td style="width: 50%; padding: 10px; border: 1px solid black;">
                <div contenteditable="true" class="chiave"></div>
            </td> 
            <td style="width: 50%; padding: 10px; border: 1px solid black;">
                <div contenteditable="true" class="valore"></div>
            </td>
        </tr>
    `
    
}

// restituisce un numero intero random tra min e max
function numeroRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

// funzione per disegnare le relazioni
function creaLineaSVG(coordinate1, coordinate2, ID_relazione='') {

    ID_relazione += '-relazione'

    // controllo se la relazione è già stata disegnata:
    relazione = document.getElementById(ID_relazione)
    if (relazione) {

        // la relazione è già stata disegnata => devo solo aggiornarla
        relazione.innerHTML = `<line x1="${coordinate1.x}" y1="${coordinate1.y}" x2="${coordinate2.x}" y2="${coordinate2.y}" stroke="black">`
        
    } else {

        // la relazione non è ancora stata di segnata
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "600%");
        svg.setAttribute("height", "600%");
        svg.setAttribute("id", ID_relazione);
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        
        linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
        linea.setAttribute("x1", coordinate1.x);
        linea.setAttribute("y1", coordinate1.y);
        linea.setAttribute("x2", coordinate2.x);
        linea.setAttribute("y2", coordinate2.y);
        linea.setAttribute("stroke", "black");
        
        svg.appendChild(linea);
        
        document.getElementById('albero').appendChild(svg);
        
    }
    
}

// funzione generalizzata per ritornare il contenuto in testo di una richiesta all'API
function api(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open(method, url);
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    resolve(request.responseText);
                } else {
                    reject(new Error(`La richiesta ha restituito lo stato ${request.status}`));
                }
            }
        };
        request.onerror = function () {
            reject(new Error('Si è verificato un errore durante la richiesta'));
        };
        request.send();
    });
}

// funzione per ottenere le coordinate dall'ID dell'oggetto
function prendiCoordinateDaIDOggetto(id) {

    // ottengo le coordinate degli angoli del rettangolo con id di input
    const rect = document.getElementById(id).getBoundingClientRect()

    // calcolo il punto centrale e lo ritorno
    return {
        x: rect.left + rect.width / 2 + window.pageXOffset, 
        y: rect.top + rect.height / 2 + window.pageYOffset
    }
}

// funzione che calcola il tempo trascorso da una certa data ad oggi
function calcolaTempoTrascorso(data) {
    // Estrai giorno, mese e anno dalla stringa della data
    var giorno = parseInt(data.substr(0, 2));
    var mese = parseInt(data.substr(2, 2)) - 1; // Sottrai 1 perché i mesi in JavaScript sono indicizzati da 0 a 11
    var anno = parseInt(data.substr(4, 4));
    
    // Crea oggetto data dalla data fornita
    var dataIniziale = new Date(anno, mese, giorno);
    
    // Ottieni la data di oggi
    var dataAttuale = new Date();
    
    // Calcola la differenza in millisecondi tra le due date
    var differenza = dataAttuale - dataIniziale;
    
    // Calcola il numero di anni trascorsi
    var anni = Math.floor(differenza / (365.25 * 24 * 60 * 60 * 1000));
    
    // Calcola il numero di mesi trascorsi
    var mesi = dataAttuale.getMonth() - dataIniziale.getMonth();
    if (mesi < 0) mesi += 12;
    
    // Calcola il numero di giorni trascorsi
    var giorni = dataAttuale.getDate() - dataIniziale.getDate();
    if (giorni < 0) {
        var ultimoGiornoMesePrecedente = new Date(dataAttuale.getFullYear(), dataAttuale.getMonth(), 0).getDate();
        giorni += ultimoGiornoMesePrecedente;
        mesi--;
    }
    
    return `${anni} anni, ${mesi} mesi e ${giorni} giorni`
}

function initFinestra() {

    // trovo l'elemento che mi compone la finestra di modifica
    finestra = document.getElementById('finestraModifica')

    // apro la finestra di modifica
    finestra.style.display = "block"
    
    // aggiungo un event listener per capire quando l'utente vuole uscire dalla finestra di modifica
    finestra.addEventListener("click", (e) => {

        // possibili altre funzioni di salvataggio dei dati ... fatte!

        // mi assicuro che il mouse abbia cliccato solo sulla parte scura
        if (e.target.id === "finestraModifica") {
            // faccio scomparire la finestra
            finestra.style.display = "none"

            // pulisco tutti gli elementi della finestra di modifica:
            document.getElementById('datiPersona').innerHTML = ''
            
        }
        
    })

    return finestra
    
}

function log(messaggio) {
    console.log(messaggio)
}
