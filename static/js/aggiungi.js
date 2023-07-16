// in questo file mi occupo dello script per aggiungere nodi e persone al sito
// in pratica gestisci 3 dei 4 bottoni in alto a destra della pagina


// --------------------- AGGIUNGO UNA RELAZIONE (figli di nodi multipli) --------------------- 

document.getElementById('connectButton').addEventListener("click", () => {

    initFinestra()

    // prima devo capire chi sono i genitori (nodi multipli) di quali figli (nodi singoli)

    // faccio due finiestre di scelta: una a sinistra con i nodi multipli e l'altra a destra con i nodi singoli:
    info = document.getElementById('datiPersona')
    info.innerHTML = `
        <h1 style="margin-bottom: 20px">Unisci i membri della relazione</h1>

        <div class="" style="display: flex;">
            <div class="" id="listaGenitori" style="flex: 1;margin-top: 20px; height: 60%; border: 1px solid gray; border-radius:20px">
            </div>
            
            <div class="" id="listaFigli" style="flex: 1;margin-top: 20px; height: 60%; border: 1px solid gray; border-radius:20px">
            </div>
        </div>

        <div class="centra">
            <button class="pulsante-ok" id="pulsante-ok">OK</button>
        </div>
    `
    coppiaGenitoriale = document.getElementById('listaGenitori')
    listaDiFigli = document.getElementById('listaFigli')

    // trovo tutti i possibili nodi (nodi singoli e multipli)
    api(`https://alberodifamiglia.albit7.repl.co/api/intero`)
        .then((dati) => {
            
            // converto i dati in un oggetto con cui posso lavorare
            db = JSON.parse(dati)
            nodi = db['nodi']
            persone = db['persone']

            // per ogni chiave nell'oggetto
            for (IDn in nodi) { // itero tutti i nodi per trovare quelli singoli e multipli

                stringaSpan = ''
                
                // se il nodo è multiplo
                if (nodi[`${IDn}`]["persone"].length != 1) { 

                    // ricavo gli id delle persone coinvolte:
                    IDpersoneRelazione = nodi[`${IDn}`]["persone"]

                    stringaSpan += `<span class="selezionabile" id="${IDpersoneRelazione}-${IDn}">`
                    
                    // e itero una persona alla volta della relazione
                    for (index in IDpersoneRelazione) {  
                        
                        // i-esima persona della relazione
                        IDp = IDpersoneRelazione[index] 
    
                        // prendo i dati della persona relativa a quel nodo singolo
                        persona = persone[`${IDp}`]
    
                        // grafico la persona nella lista
                        stringaSpan += `
                            ${persona.nome} ${persona.cognome} e 
                        `
                    }

                    stringaSpan.slice(0, -3) // elimino gli ultimi 3 caratteri " e "
                    stringaSpan += "</span><br>" // conculdo il tag

                    // aggiungo lo span con i dati dei genitori al sito
                    coppiaGenitoriale.innerHTML += stringaSpan
                    
                } 

                // invece nella lista delle persone da collegare inserisco tutti:
                for (i in nodi[`${IDn}`]["persone"]) {
                    
                    // ricavo l'id della persona che sto cercando
                    IDp = nodi[`${IDn}`]["persone"][i]

                    // prendo i dati della persona relativa a quel nodo singolo
                    persona = persone[`${IDp}`]
                    
                    // grafico la persona nella lista
                    listaDiFigli.innerHTML += `
                        <span class="selezionabile" id="${IDp}-${IDn}">${persona.nome} ${persona.cognome}</span><br>
                    `
                    
                }

            } // dopo questo for le due tabelle dovrebbero essere interamente completate

            // applico la funzione di selezione delle persone:
            var elementi = document.getElementsByClassName('selezionabile');

            for (var i = 0; i < elementi.length; ++i) {
                elementi[i].addEventListener('click', function() {
                    this.classList.toggle('selezionato')
                })
            }

        }) // strutturo la grafica per connettere le persone all'utente
        .catch(error => console.log(error)) // scovo l'errore

    // aggiungo l'event listener per il pulsante di OK
    document.getElementById("pulsante-ok").addEventListener("click", () => {

        // identifico tutti gli elementi con classe selezionato
        var spanElements = document.querySelectorAll('.selezionato')
        
        // Crea un array per salvare gli ID delle persone
        var IDnodiFigli = []       // con questi 3 array compilati
        var IDfigli = []           // correttamente riesco a creare
        var IDgenitori = []        // la connessione nel DB

        // per compilare gli array:
        
        // Itera sugli span e ottieni gli ID
        for (i = 0; i < spanElements.length; i++) {

            // formato cella id: 1,2,3,4-5
            // splitto in due

            tmp = spanElements[i].id.split("-")[0].split(",")
            if (tmp.length === 1) { // span appartenente a un figlio 

                // aggiungo voci all'array dei figli 
                IDfigli.push(spanElements[i].id.split("-")[0])
                IDnodiFigli.push(spanElements[i].id.split("-")[1])
                
            } else { // span dei genitori

                // riempo i campi degli ID genitoriali
                IDgenitori = tmp
                IDnodoGenitori = spanElements[i].id.split("-")[1]
                
            }
            
        }
    
        // creo la relazione per ogni figlio come oggetto in JS
        for (i = 0; i < IDfigli.length; ++i) {

            // strutturo la relazione:
            relazione = {
                "nodi": [IDnodoGenitori, IDnodiFigli[i]], 
                "figlio": IDfigli[i]
            }

            // invio la relazione al DB:
            var myHeaders = new Headers()
            myHeaders.append("Content-Type", "application/json")
            requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(relazione), // rendo l'oggetto un oggetto JSON inviabile
                redirect: 'follow'
            }
            fetch(`https://alberodifamiglia.albit7.repl.co/api/aggiungi/relazione/`, requestOptions)
                .then(response => response.text())
                .then(result => console.log(result))
                .catch(error => console.log('error', error))
            
        }
    
        // ricarico il db 
        document.getElementById("albero").innerHTML = ""
        caricaDB()
        // chiudo la finestra
        finestra.style.display = "none"
        document.getElementById('datiPersona').innerHTML = ''

    })

})

// --------------------- AGGIUNGO UN NODO MULTIPLO (partnership) --------------------- 

document.getElementById('uniteButton').addEventListener("click", () => {

    finestra = initFinestra()

    // devo capire quali sono gli id delle persone e dei nodi
    //idPersone = []
    //idNodo = ...

    // grafico l'interfaccia per farmi immettere in input i nodi:
    info = document.getElementById('datiPersona')
    info.innerHTML = `
        <h1 style="margin-bottom: 20px">Unisci i membri della relazione</h1>
        
        <div class="search-bar">
            <input type="text" placeholder="Cerca..." style="border: 1px solid #ccc; border-radius: 4px; padding: 8px; width: 200px;">
            <button style="background-color: blue; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">Cerca</button>
        </div>

        <div id="listaMatch" style="margin-top: 20px; height: 60%; border: 1px solid gray; border-radius:20px">
        </div>

        <div class="centra">
            <button class="pulsante-ok" id="pulsante-ok">OK</button>
        </div>
    `
    listaDiPersone = document.getElementById('listaMatch')

    // trovo tutti i possibili nodi (nodi singoli)
    api(`https://alberodifamiglia.albit7.repl.co/api/intero`)
        .then((dati) => {
            // converto i dati in un oggetto con cui posso lavorare
            db = JSON.parse(dati)
            nodi = db['nodi']
            persone = db['persone']

            // per ogni chiave nell'oggetto
            for (IDn in nodi) {

                // se il nodo è singlo
                if (nodi[IDn]["persone"].length === 1) {

                    // ricavo l'id della persona che sto cercando
                    IDp = nodi[IDn]["persone"][0] // il primo e unico elemento

                    // prendo i dati della persona relativa a quel nodo singolo
                    persona = persone[IDp]

                    // grafico la persona nella lista
                    listaDiPersone.innerHTML += `
                        <span class="selezionabile" id="${IDp}-${IDn}">${persona.nome} ${persona.cognome}</span><br>
                    `
                    
                }
                
            }

            // applico la funzione di selezione delle persone:
            var elementi = document.getElementsByClassName('selezionabile');

            for (var i = 0; i < elementi.length; i++) {
                elementi[i].addEventListener('click', function() {
                    this.classList.toggle('selezionato');
                });
            }
            
        })
        .catch(error => console.log(error))

    // una volta che il pulsante ok viene schiacciato
    // trovo gli id del nodo selezionate cercando 
    // tutte gli span con classe selezionato (il cui id è l'id nodo)
    // Seleziona tutti gli span con la classe desiderata
    document.getElementById("pulsante-ok").addEventListener("click", () => {
    
        // identifico tutti gli elementi con classe selezionato
        var spanElements = document.querySelectorAll('.selezionato')
        
        // Crea un array per salvare gli ID delle persone
        var IDnodi = []
        var IDpersone = []
        
        // Itera sugli span e ottieni gli ID
        for (i = 0; i < spanElements.length; i++) {
            IDpersone.push(spanElements[i].id.split("-")[0])
            IDnodi.push(spanElements[i].id.split("-")[1])
        }

        console.log("nodi: " + IDnodi)
        console.log("persone: " + IDpersone)
    
        // cancello dal db tutti i nodi delle persone singole
        cancellaNodi(IDnodi)
    
        // salvo il nodo che comprende tutte le persone della relazione
        nuovoNodoMultiplo = {
            "persone": IDpersone,
            "coordinate": {
                "x": window.innerWidth / 2 + window.pageXOffset, 
                "y": window.innerHeight / 2 + window.pageYOffset
            }
        }
    
        console.log("tento di salvare il nodo multiplo composto da " + IDpersone + ": \n" + JSON.stringify(nuovoNodoMultiplo))
    
        // li invio al server con la chiamata all'api
        var myHeaders = new Headers()
        myHeaders.append("Content-Type", "application/json")
        requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(nuovoNodoMultiplo), // rendo l'oggetto un oggetto JSON inviabile
            redirect: 'follow'
        }
        fetch(`https://alberodifamiglia.albit7.repl.co/api/aggiungi/nodo/`, requestOptions)
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.log('error', error))
    
        // ricarico il db 
        document.getElementById("albero").innerHTML = ""
        caricaDB()
        // chiudo la finestra
        finestra.style.display = "none"
        document.getElementById('datiPersona').innerHTML = ''

    })
    
})

// --------------------- AGGIUNGO PERSONA --------------------- 

document.getElementById('addButton').addEventListener("click", () => {

    initFinestra()

    // stessi procedimenti del modifica persona ...

    // solo che adesso non ci sono dati da populare ma solo da inserire:
    // trascrivo i dati sulla pagina HTML:
    info = document.getElementById('datiPersona')

    // nome, cognome e genere (sicuramente presenti)
    info.innerHTML = `
        <h1 style="padding-bottom: 50px;">
            <span id="nome" contenteditable="true">Nome</span> <span contenteditable="true" id="cognome">Cognome</span>
        </h1>
        <p>genere: <span id="genere" contenteditable="true">M/F/altro</span></p>
    `

    // aggiunta della data di nascita
    info.innerHTML += `
        <p>nascita: <span id="nato" contenteditable="true">gg/mm/aaaa</span></p>
    `

    // aggiungo la scritta Eventi
    info.innerHTML += '<h3 style="padding-bottom: 15px; padding-top: 20px;">Eventi</h3><table style="width: 100%; border-collapse: collapse;"><tbody id="corpo"> </tbody><tfoot id="footer"> </tfoot></table>'

    // aggiungo il pulsante del creare nuovo evento:
    document.getElementById('footer').innerHTML += `
        <tr class="riga-aggiuntiva" style="background-color: lightgray; cursor: pointer;" onclick="aggiungiEvento()">
            <td colspan="2" style="padding: 5px; border: none; border-top: 1px solid black; text-align: center; border-radius: 0 0 5px 5px;">
                <span style="display: inline-block; width:100%; border-radius: 50%; padding: 5px;">+</span>
            </td>
        </tr>
    `

    // aggiungo il pulsante di salvataggio
    info.innerHTML += `
        <div class="contenitoreBottoni">
            <button id="saveButton" class="round-button" onclick="aggiungiNodoEPersona();">
                <i class="fas fa-save"></i>
            </button>
        </div>
    ` // inserisco anche l'ID così che la funzione che si occupa di salvare i dati sa per quale persona salvarli
    // una volta che si salvano i dati della persona devo anche salvare i dati del nodo (in più rispetto a prima)
    
})

// ----------- FUNZIONI AUSILIARIE --------------

function aggiungiNodoEPersona() {

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
    personaDaAggiungere = {
        "nome": nome,
        "cognome": cognome,
        "nato": nato,
        "genere": genere,
        "eventi": eventi
    }

    console.log("tento di salvare la nuova persona: \n" + JSON.stringify(personaDaAggiungere))

    // li invio al server con la chiamata all'api
    var myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")
    requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(personaDaAggiungere), // rendo l'oggetto un oggetto JSON inviabile
        redirect: 'follow'
    }
    fetch(`https://alberodifamiglia.albit7.repl.co/api/aggiungi/persona/`, requestOptions)
        .then(response => response.text())
        .then(data => {

            console.log(data)
            
            risposta = JSON.parse(data)
            
            console.log(risposta)
            
            aggiungiNodo(risposta.id)
            
        })
        .catch(error => console.log('error', error))

    // ricarico le nuove informazioni nel sito però prima pulisco tutto
    document.getElementById('albero').innerHTML = ''
    caricaDB()

    // e poi chiudo la finestra
    document.getElementById('finestraModifica').style.display = "none"
    document.getElementById('datiPersona').innerHTML = ''
    
}

function aggiungiNodo(IDpersona) {
    
    console.log("Provo a salvare i dati del nodo: " + IDpersona)

    // creo l'oggetto nodo da memorizzare
    nodoDaSalvare = {
        "persone": [`${IDpersona}`],
        "coordinate": {
            "x": window.innerWidth / 2 + window.pageXOffset, // centro il nuovo nodo
            "y": window.innerHeight / 2 + window.pageYOffset // bel punto centrale della pagina
        }
    }

    console.log("tento di salvare il nodo " + IDpersona + ": \n" + JSON.stringify(nodoDaSalvare))

    // li invio al server con la chiamata all'api
    var myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")
    requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(nodoDaSalvare), // rendo l'oggetto un oggetto JSON inviabile
        redirect: 'follow'
    }
    fetch(`https://alberodifamiglia.albit7.repl.co/api/aggiungi/nodo/`, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error))
    
} 

function cancellaNodi(IDnodi) {

    console.log("cancello i nodi: ", IDnodi)

    IDnodi.forEach((IDn) => {
        
        api(`https://alberodifamiglia.albit7.repl.co/api/del/nodo/${IDn}`)
            .then((mex) => console.log(mex))
            .catch((err) => console.log(err))
        
    })
    
}
