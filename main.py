from flask import Flask, render_template, request
import json
import uuid

# flask init
app = Flask(__name__)

# DataBase import
DB = json.load(open("db.json", "r"))
print(DB)

# pagina principale
@app.route('/')
def index():
    return render_template('index.html')

# invio le info di utilizzo dell'API:
@app.route('/api')
def inviaInfoAPI():
    return "info varie ..."

@app.route('/api/salva')
def salvaInteroDB():

    with open("db.json", 'w') as json_file:
        json.dump(DB, json_file)
    
    return "Fatto!, DB salvato correttamente"

# -------------------- CARICA -------------------------

# invio l'intero DB:
@app.route('/api/intero')
def inviaTuttoIlDB():
    return DB

# api per richiedere tutte le persone:
@app.route('/api/persone')
def inviaTutteLePersone():
    return DB["persone"], 200
@app.route('/api/nodi')
def inviaTuttiINodi():
    return DB["nodi"], 200
@app.route('/api/relazioni')
def inviaTutteLeRelazioni():
    return DB["relazioni"], 200

# api per richiedere una singola persona:
@app.route('/api/persona/<string:ID_persona>')
def inviaSingolaPersona(ID_persona):
    return DB["persone"][ID_persona], 200
# api per richiedere un singolo nodo:
@app.route('/api/nodo/<string:ID_nodo>')
def inviaSingoloNodo(ID_nodo):
    return DB["nodi"][ID_nodo], 200
# api per richiedere una singola relazione:
@app.route('/api/relazione/<string:ID_relazione>')
def inviaSingoloRelazione(ID_relazione):
    return DB["relazioni"][ID_relazione], 200

# --------------------- MODIFICA ------------------------

@app.route('/api/update/persona/<string:ID_persona>', methods=['POST'])
def aggiornaPersona(ID_persona):
    
    if request.method == 'POST':
        # I dati inviati nella richiesta POST
        data = request.json
        # eseguo l'aggiornamento della posizione della persona
        DB["persone"][ID_persona] = data # la modifica è solo momentanea
        # Restituisci una risposta
        return {'message': 'OK'}, 200  # Codice di stato 200 OK

    else:
        return "metodo sbagliato", 300

@app.route('/api/update/nodo/<string:ID_nodo>', methods=['POST'])
def aggiornaNodo(ID_nodo):
    
    if request.method == 'POST':
        # I dati inviati nella richiesta POST
        data = request.json
        # eseguo l'aggiornamento/aggiunta della posizione del nodo
        DB["nodi"][ID_nodo] = data # la modifica è solo momentanea
        # Restituisci una risposta
        return {'message': 'OK'}, 200  # Codice di stato 200 OK

    else:
        return "metodo sbagliato", 300

@app.route('/api/update/relazione/<string:ID_relazione>', methods=['POST'])
def aggiornaRelazione(ID_relazione):
    
    if request.method == 'POST':
        # I dati inviati nella richiesta POST
        data = request.json
        # eseguo l'aggiornamento/aggiunta della posizione della relazione
        DB["relazioni"][ID_relazione] = data # la modifica è solo momentanea
        # Restituisci una risposta
        return {'message': 'OK'}, 200  # Codice di stato 200 OK

    else:
        return "metodo sbagliato", 300

# ---------------------- AGGIUNGI ------------------------

@app.route('/api/aggiungi/persona/', methods=['POST'])
def aggiungiPersona():
    
    if request.method == 'POST':
        # I dati inviati nella richiesta POST
        data = request.json
        ID = str(uuid.uuid4().hex)
        # eseguo l'inserimento nel db momentaneo
        DB["persone"][ID] = data
        print("\n\n" + str(ID) + "\n\n")
        # Restituisci una risposta
        return {"id": ID}, 200  # Codice di stato 200 OK

    else:
        return "metodo sbagliato", 300

@app.route('/api/aggiungi/nodo/', methods=['POST'])
def aggiungiNodo():
    if request.method == 'POST':
        data = request.json
        ID = str(uuid.uuid4().hex)
        DB["nodi"][ID] = data 
        return {"id": ID}, 200
    else:
        return "metodo sbagliato", 300

@app.route('/api/aggiungi/relazione/', methods=['POST'])
def aggiungiRelazione():
    if request.method == 'POST':
        data = request.json
        ID = str(uuid.uuid4().hex)
        DB["relazioni"][ID] = data 
        return {"id": ID}, 200
    else:
        return "metodo sbagliato", 300

# ---------------------- ELIMINA ------------------------

@app.route('/api/del/persona/<string:ID_persona>')
def eliminaPersona(ID_persona):
    # elimino la persona con quell'ID
    del DB["persone"][ID_persona]
    return "OK, persona " + str(ID_persona) + "eliminata", 200

@app.route('/api/del/nodo/<string:ID_nodo>')
def eliminaDodo(ID_nodo):
    # elimino la nodo con quell'ID
    del DB["nodi"][ID_nodo]
    return "OK, nodo " + str(ID_nodo) + "eliminata", 200

@app.route('/api/del/relazione/<string:ID_relazione>')
def eliminaRelazione(ID_relazione):
    # elimino la relazione con quell'ID
    del DB["relazioni"][ID_relazione]
    return "OK, relazione " + str(ID_relazione) + "eliminata", 200


app.run(host='0.0.0.0', port=81)
