const net = require('net');
const bookController = require('./controllers/bookController');
const authorController = require('./controllers/authorController');
const publisherController = require('./controllers/publisherController');
const formatter = require('./views/responseFormatter');

// Token para indicar fin de respuesta
const PROMPT_END = '__PROMPT_END__';

// Estado por cliente
const clientState = {};

function sendMenu(socket) {
    socket.write(formatter.formatMenu() + PROMPT_END);
}

// ======================================================
// Crear servidor
// ======================================================
const server = net.createServer((socket) => {
    console.log(`Cliente conectado desde ${socket.remoteAddress}:${socket.remotePort}`);

    clientState[socket.remotePort] = { mode: null, temp: {} };

    // Bienvenida inicial + menú
    socket.write("📘 Bienvenido a la Book API CLI\n");
    sendMenu(socket);

    // Manejo de mensajes del cliente
    socket.on('data', buffer => {
        const raw = buffer.toString().trim();
        const state = clientState[socket.remotePort];

        // Operaciones interactivas
        if (state.mode === 'ADD_AUTHOR') return processAddAuthor(socket, raw, state);
        if (state.mode === 'ADD_PUBLISHER') return processAddPublisher(socket, raw, state);
        if (state.mode === 'ADD_BOOK') return processAddBook(socket, raw, state);
        if (state.mode === 'SEARCH_BOOK') return processSearchBook(socket, raw, state);
        if (state.mode === 'SEARCH_AUTHOR') return processSearchAuthor(socket, raw, state);

        // Comandos simples
        handleCommand(socket, raw);
    });

    socket.on('end', () => {
        console.log(`Cliente desconectado ${socket.remoteAddress}:${socket.remotePort}`);
        delete clientState[socket.remotePort];
    });

    socket.on('error', (err) => {
        console.error(`Socket error:`, err.message);
        delete clientState[socket.remotePort];
    });
});

// ======================================================
// MODE: ADD AUTHOR
// ======================================================
function processAddAuthor(socket, raw, state) {
    const name = raw.trim();
    const result = authorController.addAuthor({ name });

    state.mode = null;
    state.temp = {};

    if (result.error) socket.write(`❌ Error: ${result.error}\n`);
    else socket.write(formatter.formatCreated('autor', result));

    sendMenu(socket);
}

// ======================================================
// MODE: ADD PUBLISHER
// ======================================================
function processAddPublisher(socket, raw, state) {
    const name = raw.trim();
    const result = publisherController.addPublisher({ name });

    state.mode = null;
    state.temp = {};

    if (result.error) socket.write(`❌ Error: ${result.error}\n`);
    else socket.write(formatter.formatCreated('editorial', result));

    sendMenu(socket);
}

// ======================================================
// MODE: ADD BOOK (4 pasos)
// ======================================================
function processAddBook(socket, raw, state) {
    if (!state.temp.step) state.temp.step = 1;

    const step = state.temp.step;

    if (step === 1) {
        state.temp.title = raw;
        state.temp.step = 2;
        return socket.write("🗓️  Escribe el año de publicación:\n");
    }

    if (step === 2) {
        state.temp.year = raw;
        state.temp.step = 3;
        return socket.write("👤  Escribe el nombre del autor:\n");
    }

    if (step === 3) {
        state.temp.authorName = raw;
        state.temp.step = 4;
        return socket.write("🏢  Escribe el nombre de la editorial:\n");
    }

    if (step === 4) {
        state.temp.publisherName = raw;

        const result = bookController.addBook({
            title: state.temp.title,
            year: state.temp.year,
            authorName: state.temp.authorName,
            publisherName: state.temp.publisherName
        });

        state.mode = null;
        state.temp = {};

        if (result.error) socket.write(`❌ Error: ${result.error}\n`);
        else socket.write(formatter.formatCreated('libro', result));

        sendMenu(socket);
    }
}

// ======================================================
// MODE: SEARCH BOOK
// ======================================================
function processSearchBook(socket, raw, state) {
    const term = raw.trim();
    const found = bookController.searchBooks(term);

    state.mode = null;
    state.temp = {};

    if (!found.length) socket.write(`🔎 No se encontraron libros con "${term}".\n`);
    else socket.write(formatter.formatList(found, 'libros'));

    sendMenu(socket);
}

// ======================================================
// MODE: SEARCH AUTHOR
// ======================================================
function processSearchAuthor(socket, raw, state) {
    const term = raw.trim();
    const found = authorController.searchAuthorByName(term);

    state.mode = null;
    state.temp = {};

    if (!found.length) socket.write(`🔎 No se encontraron autores con "${term}".\n`);
    else socket.write(formatter.formatList(found, 'autores'));

    sendMenu(socket);
}

// ======================================================
// COMANDOS SIMPLES
// ======================================================
function handleCommand(socket, raw) {
    const cmd = raw.toUpperCase();

    if (cmd === "EXIT") {
        socket.end("🔌 Conexión cerrada por el servidor.\n");
        return;
    }

    if (cmd === "GET BOOKS") {
        const data = bookController.listBooks();
        socket.write(formatter.formatList(data, 'libros'));
        return sendMenu(socket);
    }

    if (cmd === "GET AUTHORS") {
        const data = authorController.listAuthors();
        socket.write(formatter.formatList(data, 'autores'));
        return sendMenu(socket);
    }

    if (cmd === "GET PUBLISHERS") {
        const data = publisherController.listPublishers();
        socket.write(formatter.formatList(data, 'editoriales'));
        return sendMenu(socket);
    }

    if (cmd === "ADD AUTHOR") {
        clientState[socket.remotePort].mode = "ADD_AUTHOR";
        return socket.write("✍️  Escribe el nombre del autor:\n");
    }

    if (cmd === "ADD PUBLISHER") {
        clientState[socket.remotePort].mode = "ADD_PUBLISHER";
        return socket.write("🏢  Escribe el nombre de la editorial:\n");
    }

    if (cmd === "ADD BOOK") {
        clientState[socket.remotePort].mode = "ADD_BOOK";
        clientState[socket.remotePort].temp = { step: 1 };
        return socket.write("📚  Escribe el título del libro:\n");
    }

    if (cmd === "SEARCH BOOK") {
        clientState[socket.remotePort].mode = "SEARCH_BOOK";
        return socket.write("🔎  Escribe término para buscar libro:\n");
    }

    if (cmd === "SEARCH AUTHOR") {
        clientState[socket.remotePort].mode = "SEARCH_AUTHOR";
        return socket.write("🔎  Escribe nombre o término para buscar autor:\n");
    }

    socket.write("❌ Comando no reconocido.\n");
    sendMenu(socket);
}

// ======================================================
server.listen(8080, () => {
    console.log("🚀 Servidor TCP escuchando en puerto 8080");
});
