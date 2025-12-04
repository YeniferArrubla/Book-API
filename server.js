const net = require('net');
const bookController = require('./controllers/bookController');
const authorController = require('./controllers/authorController');
const publisherController = require('./controllers/publisherController');
const formatter = require('./views/responseFormatter');

// Estado por cliente (por remotePort)
const clientState = {};

// Inicia servidor
const server = net.createServer((socket) => {
    // Mostrar en consola la conexión (address y puerto)
    console.log(`Cliente conectado desde ${socket.remoteAddress}:${socket.remotePort}`);

    // Inicializar estado para este socket
    clientState[socket.remotePort] = { mode: null, temp: {} };

    // Mensaje de bienvenida al cliente
    socket.write("📘 Bienvenido a la Book API CLI\n");
    socket.write("Comandos: GET BOOKS | GET AUTHORS | GET PUBLISHERS | ADD BOOK | ADD AUTHOR | ADD PUBLISHER | SEARCH BOOK | SEARCH AUTHOR | EXIT\n");

    // Eventos de datos
    socket.on('data', (buffer) => {
        const raw = buffer.toString().trim();
        const state = clientState[socket.remotePort];

        // Si estamos en un modo interactivo, procesarlo
        if (state.mode === 'ADD_AUTHOR') return processAddAuthor(socket, raw, state);
        if (state.mode === 'ADD_PUBLISHER') return processAddPublisher(socket, raw, state);
        if (state.mode === 'ADD_BOOK') return processAddBook(socket, raw, state);
        if (state.mode === 'SEARCH_BOOK') return processSearchBook(socket, raw, state);
        if (state.mode === 'SEARCH_AUTHOR') return processSearchAuthor(socket, raw, state);

        // Si no, interpretar comando simple
        handleCommand(socket, raw);
    });

    socket.on('end', () => {
        console.log(`Cliente desconectado ${socket.remoteAddress}:${socket.remotePort}`);
        delete clientState[socket.remotePort];
    });

    socket.on('error', (err) => {
        console.error(`Socket error ${socket.remoteAddress}:${socket.remotePort} -`, err.message);
        delete clientState[socket.remotePort];
    });
});


// ---------- FUNCIONES DE PROCESO (interactivo) ----------

// ADD AUTHOR (simple: pide nombre)
function processAddAuthor(socket, raw, state) {
    // raw -> nombre del autor (puede incluir nacionalidad después con formato "Nombre | Nacionalidad")
    const parts = raw.split('|').map(s => s.trim());
    const name = parts[0];
    const nationality = parts[1] || '';

    const result = authorController.addAuthor({ name, nationality });

    state.mode = null;
    state.temp = {};

    if (result.error) {
        socket.write(`❌ Error: ${result.error}\n`);
    } else {
        socket.write(formatter.formatCreated('autor', result));
    }
}

// ADD PUBLISHER (simple: pide nombre)
function processAddPublisher(socket, raw, state) {
    const name = raw.trim();
    const result = publisherController.addPublisher({ name });

    state.mode = null;
    state.temp = {};

    if (result.error) {
        socket.write(`❌ Error: ${result.error}\n`);
    } else {
        socket.write(formatter.formatCreated('editorial', result));
    }
}

// ADD BOOK (4 pasos con nombres)
function processAddBook(socket, raw, state) {
    // Usamos state.temp.step para saber en qué paso estamos
    if (!state.temp.step) state.temp.step = 1;

    // Paso 1: título
    if (state.temp.step === 1) {
        state.temp.title = raw;
        state.temp.step = 2;
        return socket.write("🗓️ Escribe el año de publicación:\n");
    }

    // Paso 2: año
    if (state.temp.step === 2) {
        state.temp.year = raw;
        state.temp.step = 3;
        return socket.write("👤 Escribe el nombre del autor (o 'Nombre | Nacionalidad'):\n");
    }

    // Paso 3: autor (nombre)
    if (state.temp.step === 3) {
        // Permitimos "Name | Nationality" si el cliente lo da así
        const parts = raw.split('|').map(s => s.trim());
        state.temp.authorName = parts[0];
        if (parts[1]) state.temp.authorNationality = parts[1];
        state.temp.step = 4;
        return socket.write("🏢 Escribe el nombre de la editorial:\n");
    }

    // Paso 4: editorial -> crear libro
    if (state.temp.step === 4) {
        state.temp.publisherName = raw;

        // Invocamos al controlador (se encargará de crear autor/editorial si es necesario)
        const result = bookController.addBook({
            title: state.temp.title,
            year: state.temp.year,
            authorName: state.temp.authorName,
            publisherName: state.temp.publisherName
        });

        // Limpiar estado
        state.mode = null;
        state.temp = {};

        if (result.error) {
            return socket.write(`❌ Error: ${result.error}\n`);
        }

        // Enviamos confirmación bonita
        socket.write(formatter.formatCreated('libro', result));
    }
}

// SEARCH BOOK (interactivo: pide término)
function processSearchBook(socket, raw, state) {
    const term = raw.trim();
    const found = bookController.searchBooks(term);

    state.mode = null;
    state.temp = {};

    if (!found || found.length === 0) {
        return socket.write(`🔎 No se encontraron libros con "${term}".\n`);
    }

    // Enviar lista con formatter (formatter espera lista de libros)
    return socket.write(formatter.formatList(found, 'libros'));
}

// SEARCH AUTHOR (interactivo: pide nombre o término)
function processSearchAuthor(socket, raw, state) {
    const term = raw.trim();
    const found = authorController.searchAuthorByName(term);

    state.mode = null;
    state.temp = {};

    if (!found || found.length === 0) {
        return socket.write(`🔎 No se encontraron autores con "${term}".\n`);
    }

    return socket.write(formatter.formatList(found, 'autores'));
}


// ---------- MANEJO DE COMANDOS SIMPLES ----------
function handleCommand(socket, raw) {
    const command = raw.trim().toUpperCase();

    // EXIT
    if (command === 'EXIT') {
        socket.write("🔌 Conexión cerrada por el servidor. ¡Adiós!\n");
        return socket.end();
    }

    // GET BOOKS
    if (command === 'GET BOOKS') {
        // Llamada al controlador (en consola se verá)
        const books = bookController.listBooks();
        return socket.write(formatter.formatList(books, 'libros'));
    }

    // GET AUTHORS
    if (command === 'GET AUTHORS') {
        const authors = authorController.listAuthors();
        return socket.write(formatter.formatList(authors, 'autores'));
    }

    // GET PUBLISHERS
    if (command === 'GET PUBLISHERS') {
        const publishers = publisherController.listPublishers();
        return socket.write(formatter.formatList(publishers, 'editoriales'));
    }

    // ADD AUTHOR (inicia modo interactivo)
    if (command === 'ADD AUTHOR') {
        clientState[socket.remotePort].mode = 'ADD_AUTHOR';
        clientState[socket.remotePort].temp = {};
        return socket.write("✍️ Escribe el nombre del autor (o 'Nombre | Nacionalidad'):\n");
    }

    // ADD PUBLISHER (inicia modo interactivo)
    if (command === 'ADD PUBLISHER') {
        clientState[socket.remotePort].mode = 'ADD_PUBLISHER';
        clientState[socket.remotePort].temp = {};
        return socket.write("🏢 Escribe el nombre de la editorial:\n");
    }

    // ADD BOOK (inicia modo interactivo)
    if (command === 'ADD BOOK') {
        clientState[socket.remotePort].mode = 'ADD_BOOK';
        clientState[socket.remotePort].temp = { step: 1 };
        return socket.write("📚 Escribe el título del libro:\n");
    }

    // SEARCH BOOK (inicia modo interactivo)
    if (command === 'SEARCH BOOK') {
        clientState[socket.remotePort].mode = 'SEARCH_BOOK';
        clientState[socket.remotePort].temp = {};
        return socket.write("🔎 Escribe término para buscar libro (título o autor):\n");
    }

    // SEARCH AUTHOR (inicia modo interactivo)
    if (command === 'SEARCH AUTHOR') {
        clientState[socket.remotePort].mode = 'SEARCH_AUTHOR';
        clientState[socket.remotePort].temp = {};
        return socket.write("🔎 Escribe nombre o término para buscar autor:\n");
    }

    // No reconocido
    socket.write("❌ Comando no reconocido. Escribe alguno de: GET BOOKS | GET AUTHORS | GET PUBLISHERS | ADD BOOK | ADD AUTHOR | ADD PUBLISHER | SEARCH BOOK | SEARCH AUTHOR | EXIT\n");
}


// Iniciar servidor
server.listen(8080, () => {
    console.log("🚀 Servidor TCP escuchando en puerto 8080");
});
