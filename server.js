const net = require('net');
const bookController = require('./controllers/bookController');
const authorController = require('./controllers/authorController');
const publisherController = require('./controllers/publisherController');
const formatter = require('./views/responseFormatter');

// ================================================
// ESTADO DE LOS CLIENTES
// ================================================
const clientState = {};

// ================================================
// PROCESOS INTERACTIVOS
// ================================================

// ---------- ADD AUTHOR ----------
function processAddAuthor(socket, raw, state) {
    state.temp.name = raw;

    const result = authorController.addAuthor({
        name: state.temp.name
    });

    state.mode = null;
    state.temp = {};

    if (result.error) {
        socket.write(`❌ Error: ${result.error}\n`);
    } else {
        socket.write(formatter.formatCreated('autor', result));
    }
}

// ---------- ADD PUBLISHER ----------
function processAddPublisher(socket, raw, state) {
    state.temp.name = raw;

    const result = publisherController.addPublisher({
        name: state.temp.name
    });

    state.mode = null;
    state.temp = {};

    if (result.error) {
        socket.write(`❌ Error: ${result.error}\n`);
    } else {
        socket.write(formatter.formatCreated('editorial', result));
    }
}

// ---------- ADD BOOK (4 pasos con NOMBRES, no IDs) ----------
function processAddBook(socket, raw, state) {
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
        return socket.write("👤 Escribe el nombre del autor:\n");
    }

    // Paso 3: nombre del autor
    if (state.temp.step === 3) {
        state.temp.authorName = raw;
        state.temp.step = 4;
        return socket.write("🏢 Escribe el nombre de la editorial:\n");
    }

    // Paso 4: editorial → crear libro
    if (state.temp.step === 4) {
        state.temp.publisherName = raw;

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

        socket.write(formatter.formatCreated('libro', result));
    }
}

// ================================================
// MANEJO DE COMANDOS NORMALES
// ================================================
function handleCommand(socket, command) {
    command = command.toUpperCase();

    // ------ SALIDA ------
    if (command === 'EXIT') {
        socket.write("🔌 Conexión cerrada por el servidor.\n");
        return socket.end();
    }

    // ------ GETS ------
    if (command === 'GET BOOKS') {
        const books = bookController.listBooks();
        return socket.write(formatter.formatList(books, 'libros'));
    }

    if (command === 'GET AUTHORS') {
        const authors = authorController.listAuthors();
        return socket.write(formatter.formatList(authors, 'autores'));
    }

    if (command === 'GET PUBLISHERS') {
        const publishers = publisherController.listPublishers();
        return socket.write(formatter.formatList(publishers, 'editoriales'));
    }

    // ------ ADD AUTHOR ------
    if (command === 'ADD AUTHOR') {
        clientState[socket.remotePort].mode = 'ADD_AUTHOR';
        return socket.write("✍️ Escribe el nombre del autor:\n");
    }

    // ------ ADD PUBLISHER ------
    if (command === 'ADD PUBLISHER') {
        clientState[socket.remotePort].mode = 'ADD_PUBLISHER';
        return socket.write("🏢 Escribe el nombre de la editorial:\n");
    }

    // ------ ADD BOOK ------
    if (command === 'ADD BOOK') {
        const state = clientState[socket.remotePort];
        state.mode = 'ADD_BOOK';
        state.temp = { step: 1 };
        return socket.write("📚 Escribe el título del libro:\n");
    }

    socket.write("❌ Comando no reconocido.\n");
}

// ================================================
// SERVIDOR TCP
// ================================================
const server = net.createServer((socket) => {
    console.log("Cliente conectado.");

    clientState[socket.remotePort] = { mode: null, temp: {} };

    socket.write(
        "📘 Bienvenido a la Book API CLI\n" +
        "Comandos: GET BOOKS | GET AUTHORS | GET PUBLISHERS | ADD BOOK | ADD AUTHOR | ADD PUBLISHER | EXIT\n"
    );

    socket.on('data', (data) => {
        const raw = data.toString().trim();
        const state = clientState[socket.remotePort];

        if (state.mode === 'ADD_AUTHOR') return processAddAuthor(socket, raw, state);
        if (state.mode === 'ADD_PUBLISHER') return processAddPublisher(socket, raw, state);
        if (state.mode === 'ADD_BOOK') return processAddBook(socket, raw, state);

        handleCommand(socket, raw);
    });

    socket.on('close', () => {
        delete clientState[socket.remotePort];
        console.log("Cliente desconectado.");
    });
});

server.listen(8080, () => {
    console.log("🚀 Servidor TCP escuchando en puerto 8080");
});
