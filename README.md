# ALBERO DI FAMIGLIA
App per creare e modificare un albero di famiglia:
-------

# STRUTTURA DB

Possibili approcci per la creazione di un DataBase di tipo JSON:

## Versione 1.0

l'idea è quella di fare un db diviso in due parti:
- **persone**: con all'interno tutte le persone presenti nell'albero con i relativi dati anagrafici
- **famiglie**: ogni oggetto rappresenta una famiglia ristretta (*papà + mamma + figli*)

Nella sezione **persone** una bozza di persona potrebbe essere questa:
```
ID-persona: {
	"nome": "Alberto",
	"cognome": "Pini",
	"genere": "M",
	"nato": "25112003",
	"morto": "-",
	"note": "il creatore di questo albero genialogico"
}
```
Nella sezione **famiglie** invece:
```
ID-famiglia: {
	"uomo": ID-persona A,
	"donna": ID-persona B,
	"figli": [
		ID-persona C,
		ID-persona D,
		ID-persona E
	],
	"note": "sposati/conviventi/separati"
	"date": [
		"sposati": "25012003",
		...
	]
}
```
## Versione 2.0
Guardando un po' online ho trovato [questo](https://balkan.app/FamilyTreeJS/Docs/Exporting). Una libreria in JavaScript che si specializza proprio negli alberi famigliari. Avevano l'opzione di esportare il proprio albero nel formato JSON e allora ho curiosato con un sample che mettevano a disposizione.
L'idea è quella di aggiungere ad ogni persona le informazioni dei partner con cui sono stati e dei genitori dal quale rapporto sono nati. 
Per esempio:
```
{
	{
		"ID-persona": 1,
		"nome": "Mario",
		"cognome": "Rossi",
        "genere": "M"
		"ID-padre": ID-persona-padre,
		"ID-madre": ID-persona-madre,
        "ID-partners": [ID-partner-1,...,ID-partener-N],
        "eventi": [
            {"nato": ""},
            ...
        ]
	}
}
```
In questo modo si evita la necessità di avere una sezione apposita per le relazioni genitoriali. Ovviamente le persone con stessi genitori diventano automaticamente fratelli e saranno tutti collegati dalla stessa relazione padre-madre.

## Versione 3.0

USARE I NODI!!
in pratica avere un grafo a nodi con 2 tipi di nodi:

1. **singoli** $\text{type}=1$
2. **multipli** $\text{type}=2$

I nodi singoli sono contrassegnati da un tipo proprio per questo motivo. Nei nodi singoli è presente solo una persona, in quelli multili 2 persone (generalemente) o più (diversi matrimoni)

Quindi come nella versione 1.0 il DB sarà diviso in 3 campi: 


Quello delle **persone**:
```
"persone": {
	ID-persona-1: {
		"nome": "Alberto",
		"cognome": "Pini",
		"genere": "M",
		"nato": "25112003",
		"morto": "-",
		"note": "il creatore di questo albero genialogico"
	},
	... 
	ID-persona-N: {}
}
```
Quello delle **nodi**:
```
"nodi": {
	ID-nodo-1:[ID-persona-1, ID-persona-8, ID-persona-4],
	ID-nodo-2:[ID-persona-13, ID-persona-38],
	...
	ID-nodo-N:[ID-persona-3]
}
```
Quello delle **relazioni**:
```
"relazioni": {
	ID-relazione-1: {
		"nodi": [ID-nodo-2, ID-nodo-1],
		"figlio": ID-persona-8
	}, // qundi il figlio della coppia 13-38 è la persona 8
	...
}
```
Le relazioni tra i nodi sono direzionali e vanno da nodo multiplo (coppia genitoriale) al figlio (che potrebbe appartenere ad un altro nodo multiplo (come nel caso della relazione 1)).


---
>La scelta cadrà probabilmente sul terzo tipo di database.
>Prima di scegliere però devo vedere come questo db si relaziona con la struttura del sito da creare

# SITO

Qui si tratta di definrire la struttura del sito e come fare a strutturare un albero familiare sia in *CSS*
 che in *HTML*.
 
## HTML

### V1 (scartata)
La struttura del sito è in layers. Ogni layer ha tutti fratelli e sorelle di una certa famiglia:
 ```
1°        A--|--B                     F--|--G
        |-----|------|           |--------|-------|
2°     C     D      E           H        I       L--|--M 
                                                 |---|---|
3°                                              N       O
  ```  
La struttura dell'hatl funziona così
 ```
 <dir id="1" class="linea">
	 <dir class="famiglia">
			
	 </dir> 
 </dir>
 ```
### V2
La seconda versione della struttura HTML ha nel cuore il DB grafico teorizzato nella versione 3. L'idea è quella di creare un sito dinamico in cui appunto si spostano nodi in giro (con eventuali funzioni di auto ordinamento). In sostanza si va a graficare il grafo direzionale già presente nel database alterandolo solo nei casi di nodi multipli.
L'HTML dev'essere generata dinamicamente dal JS che riceve i dati del DB dal server. Il funzionamento è proceduale:

1. arriva il sotto-DB dei nodi e il sotto-DB delle persone (mediante API)
2. si graficano tutti i nodi singoli (rettangoli) e multipli (cerchi) 
3. all'interno dei nodi multipli si graficano i rettangoli con le singole persone
4. arriva il sotto-DB delle relazioni (mediante API)
5. si graficano tutte le relazioni tra i nodi tenendo conto dei nodi multipli

Tratto tutti i rettangoli delle persone come div di *class="persona"* e *id="ID-persona"* 
I nodi sono div che hanno *class="singolo"* e *class="multiplo"* e *id="ID-nodo"*
Quindi:
Per le **persone**:
```
<div class="persona femmina spostabile" id="spostabile">
    <span>Nome</span></br>
    <span>Cognome</span>
</div>
```
Per i **nodi**:
```
<div class="singolo" id="ID-nodo">
	<div class="persona" id="ID-persona">...<\div>
<\div>
<div class="multiplo" id="ID-nodo">
	<div class="persona-1" id="ID-persona">...<\div>
	...
	<div class="persona-N" id="ID-persona">...<\div>
<\div>
```


## CSS

Se si utilizza l'approccio CSS conviene fare un rettangolino per ogni persona con nome e cognome e aggiungere 4 tipi di classi che aggiungono linee in tutte le 4 direzioni !!!!DA RIVEDERE A SECONDA DEL DATABASE DA FARE!!!!

La linea tra due nodi (multipli o singoli) la eseguo con un SVG a partire dalle relazioni tra i nodi ricavate dal DB:

```
function  creaLineaSVG(x1, y1, x2, y2) { const svgNS = "http://www.w3.org/2000/svg"; const svg = document.createElementNS(svgNS, "svg"); svg.setAttribute("width", "100%"); svg.setAttribute("height", "100%"); svg.style.position = "absolute"; svg.style.top = "0"; svg.style.left = "0"; const linea = document.createElementNS(svgNS, "line"); linea.setAttribute("x1", x1); linea.setAttribute("y1", y1); linea.setAttribute("x2", x2); linea.setAttribute("y2", y2); linea.setAttribute("stroke", "black"); svg.appendChild(linea); document.body.appendChild(svg); }
```


## Problemi vari:

Vari problemi da risolvere col l'idea di programma
- struttura dinamica della pagina html
	- si può generare un SVG in-browser con JS a partire da i dati di un singolo albero familiare
	- l'immagine SVG di una persona può essere:
 ```
  <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">

 <g>
  <title>Layer 1</title>
  <rect rx="20" id="svg_1" height="70" width="150" y="265" x="325" stroke="#000" fill="#fff"/>
  <text transform="matrix(1 0 0 1 0 0)" stroke="#000" xml:space="preserve" text-anchor="start" font-family="Noto Sans JP" font-size="24" id="svg_3" y="308" x="370.67188" stroke-width="0" fill="#000000">Nome</text>
 </g>
</svg>
 ```

- passare dai dati del DB a un'immagine SVG
- alberi genialogici di diversi parenti che intaccano altri alberi genialogici
	- La cosa migliore da fare se non si trova una soluzione è quella di mettere un bottone su altri parenti che fa caricare l'albero famigliare di quel parente senza crearne altri
	- Si può fare che la vista è di solo un albero familare di poche generazioni senza le famiglie dei faratelli o sorelle


# API

Funzioni che dev'essere in grado di svolgere:

- richiedere il DB intero
- richiedere interamente i 3 sotto-DB:
	- persone
	- nodi
	- relazioni
- richiedere i dati di una singola persona con l'ID-persona
- richiedere i dati di un singolo nodo con l'ID-nodo
- richiedere i dati di una singola relazione con l'ID-relazione
- postare la posizione di ogni nodo nel sito al db

---
Per ottenere l'intero DB:
```
https://alberodifamiglia.albit7.repl.co/api/intero
```
Le successive richieste singole:
```
https://alberodifamiglia.albit7.repl.co/api/...
--> /persona/ID-persona
--> /nodo/ID-nodo
--> /relazione/ID-relazione
```
codice server Python delle 5 possibili richieste:
```
# invio le info di utilizzo dell'API:
@app.route('/api')
def inviaInfoAPI():
    return "info varie ..."

# invio l'intero DB:
@app.route('/api/intero')
def inviaTuttoIlDB():
    return DB

# api per richiedere una singola persona:
@app.route('/api/persona/<string:ID_persona>')
def inviaSingolaPersona(ID_persona):
    return DB["persone"][ID_persona]
    
# api per richiedere un singolo nodo:
@app.route('/api/nodo/<string:ID_nodo>')
def inviaSingoloNodo(ID_nodo):
    return DB["nodi"][ID_nodo]
    
# api per richiedere una singola relazione:
@app.route('/api/relazione/<string:ID_relazione>')
def inviaSingoloRelazione(ID_relazione):
    return DB["relazioni"][ID_relazione]
```

# Piccolo DB:

```
{"persone": {"cd853793444f42b6acdaa8759bc565fa": {"nome": "Alberto", "cognome": "Pini", "nato": "25112003", "genere": "M", "eventi": {}}, "abca1cc0b9684edd91b4ec0161e450f6": {"nome": "Emma", "cognome": "Pini", "nato": "10052005", "genere": "F", "eventi": {}}, "cfbe7adc64c0420db170b077f55fe193": {"nome": "Sergio", "cognome": "Pini", "nato": "03101974", "genere": "M", "eventi": {}}, "11f1279ce6954900a12bf4fa0224bc6a": {"nome": "Samuela", "cognome": "Robbiani", "nato": "28111975", "genere": "F", "eventi": {}}, "efd8d069674048f8bf6d9aff74a6f2e9": {"nome": "Guglielmo", "cognome": "Pini", "nato": "23112008", "genere": "M", "eventi": {}}}, "nodi": {"8399929fc54846b59d447aa95b8af454": {"persone": ["cd853793444f42b6acdaa8759bc565fa"], "coordinate": {"x": "463px", "y": "249px"}}, "5ab1a90c4f484f0e9d97cbee125df27b": {"persone": ["abca1cc0b9684edd91b4ec0161e450f6"], "coordinate": {"x": "553px", "y": "248px"}}, "007f6482222e4370b346f2b0e2b57913": {"persone": ["cfbe7adc64c0420db170b077f55fe193", "11f1279ce6954900a12bf4fa0224bc6a"], "coordinate": {"x": "515px", "y": "426px"}}, "0c741e8929c240768cdc4125b933ec1b": {"persone": ["efd8d069674048f8bf6d9aff74a6f2e9"], "coordinate": {"x": "650px", "y": "251px"}}}, "relazioni": {"40e51935fa804cf4a7b59c91b10ae693": {"nodi": ["007f6482222e4370b346f2b0e2b57913", "5ab1a90c4f484f0e9d97cbee125df27b"], "figlio": "abca1cc0b9684edd91b4ec0161e450f6"}, "5ec6a3b6b61042fe9761afa697e3a358": {"nodi": ["007f6482222e4370b346f2b0e2b57913", "8399929fc54846b59d447aa95b8af454"], "figlio": "cd853793444f42b6acdaa8759bc565fa"}, "0f96857372e64c03bade7ade5cf08759": {"nodi": ["007f6482222e4370b346f2b0e2b57913", "0c741e8929c240768cdc4125b933ec1b"], "figlio": "efd8d069674048f8bf6d9aff74a6f2e9"}}}
```
