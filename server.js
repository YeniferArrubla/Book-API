const net = require('net');
const authorController = require('./controllers/authorController');
const bookController = require('./controllers/bookController');
const publisherController = require('./controllers/publisherController');
const formatter = require('./views/responseFormatter');

// utilidad para intentar parsear JSON con try/catch
function tryParseJSON(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
}

// helper: búsqueda de autor vía controller (si controller no expone find, hacemos fallback)
function findAuthorByNameSafe(name) {
    if (!name) return null;
    if (typeof authorController.findAuthorByName === 'function') {
        return authorController.findAuthorByName(name);
    }
    // fallback: search in list
    const authors = authorController.getAuthors();
    return authors.find(a => a.name && a.name.trim().toLowerCase() === name.trim().toLowerCase()) || null;
}

// helper: búsqueda de publisher vía controller (con fallback)
function findPublisherByNameSafe(name) {
    if (!name) return null;
    if (typeof publisherController.findPublisherByName === 'function') {
        return publisherController.findPublisherByName(name);
    }
    const publishers = publisherController.getPublishers();
    return publishers.find(p => p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase()) || null;
}

// Inicializa un objeto de interacción por socket
function startInteraction(socket, type) {
    socket.currentInteraction = {
        type: type,     // 'ADD_BOOK' | 'ADD_AUTHOR' | 'ADD_PUBLISHER'
        step: 1,
        temp: {}
    };
}

// Limpia la interacción actual
function resetInteraction(socket) {
    socket.currentInteraction = null;
}

// Creamos el servidor
const server = net.createServer((socket) => {
    console.log('Cliente conectado:', socket.remoteAddress, socket.remotePort);
    socket.currentInteraction = null; // estado de interacción por socket
    socket.write('Bienvenido al Library API TCP. Escribe un comando o HELP para ver opciones.\n');

    socket.on('data', (buffer) => {
        // No convertimos todo a mayúsculas — usamos rawMessage para mantener JSON intacto
        const rawMessage = buffer.toString().trim();
        const upperMessage = rawMessage.toUpperCase(); // para comparar comandos sin alterar payload
        // console.log para depuración
        console.log('Comando/Entrada recibido:', rawMessage);

        // 1) Si hay una interacción activa la procesamos primero (ADD BOOK, ADD AUTHOR, ADD PUBLISHER)
        if (socket.currentInteraction) {
            // permitir cancelar en cualquier paso
            if (rawMessage.toUpperCase() === 'CANCEL') {
                socket.write('Proceso cancelado.\n');
                resetInteraction(socket);
                return;
            }

            // ruteo según tipo de interacción
            if (socket.currentInteraction.type === 'ADD_BOOK') {
                // mantengo tu función existente (usa nombres completos dentro)
                handleAddBookFlow(socket, rawMessage);
                return;
            }

            if (socket.currentInteraction.type === 'ADD_AUTHOR') {
                handleAddAuthorFlow(socket, rawMessage);
                return;
            }

            if (socket.currentInteraction.type === 'ADD_PUBLISHER') {
                handleAddPublisherFlow(socket, rawMessage);
                return;
            }
        }

        // 2) Comandos directos / no-interactivos
        // HELP
        if (upperMessage === 'HELP') {
            const help = [
                'Comandos disponibles:',
                '- GET BOOKS',
                '- ADD BOOK (flujo interactivo)',
                '- GET AUTHORS',
                "- ADD AUTHOR (flujo interactivo) o ADD AUTHOR {json}",
                '- GET PUBLISHERS',
                "- ADD PUBLISHER (flujo interactivo) o ADD PUBLISHER {json}",
                '- EXIT (cierra conexión)',
                '- CANCEL (cancela el flujo interactivo actual)'
            ].join('\n');
            socket.write(help + '\n');
            return;
        }

        // EXIT
        if (upperMessage === 'EXIT') {
            socket.write('Cerrando conexión. ¡Adiós!\n');
            socket.end();
            return;
        }

        // GET AUTHORS
        if (upperMessage === 'GET AUTHORS') {
            const authors = authorController.getAuthors();
            socket.write(formatter.formatList(authors, 'autores') + '\n');
            return;
        }

        // ADD AUTHOR with JSON on same line: "ADD AUTHOR { ... }"
        if (upperMessage.startsWith('ADD AUTHOR ') && rawMessage.length > 'ADD AUTHOR '.length) {
            const payloadString = rawMessage.slice('ADD AUTHOR '.length).trim();
            const payloadObj = tryParseJSON(payloadString);
            if (!payloadObj || !payloadObj.name) {
                socket.write('Error: JSON inválido o falta campo "name" para ADD AUTHOR.\n');
                return;
            }
            const existingAuthor = findAuthorByNameSafe(payloadObj.name);
            if (existingAuthor) {
                socket.write(`El autor "${existingAuthor.name}" ya existe.\n`);
                return;
            }
            const created = authorController.addAuthor({ name: payloadObj.name });
            if (created) {
                socket.write(`✔️ Autor creado correctamente: ${created.name}\n`);
            } else {
                socket.write('Error al crear autor.\n');
            }
            return;
        }

        // GET PUBLISHERS
        if (upperMessage === 'GET PUBLISHERS') {
            const publishers = publisherController.getPublishers();
            socket.write(formatter.formatList(publishers, 'editoriales') + '\n');
            return;
        }

        // ADD PUBLISHER with JSON on same line
        if (upperMessage.startsWith('ADD PUBLISHER ') && rawMessage.length > 'ADD PUBLISHER '.length) {
            const payloadString = rawMessage.slice('ADD PUBLISHER '.length).trim();
            const payloadObj = tryParseJSON(payloadString);
            if (!payloadObj || !payloadObj.name) {
                socket.write('Error: JSON inválido o falta campo "name" para ADD PUBLISHER.\n');
                return;
            }
            const existingPublisher = findPublisherByNameSafe(payloadObj.name);
            if (existingPublisher) {
                socket.write(`La editorial "${existingPublisher.name}" ya existe.\n`);
                return;
            }
            const created = publisherController.addPublisher({ name: payloadObj.name });
            if (created) {
                socket.write(`✔️ Editorial creada correctamente: ${created.name}\n`);
            } else {
                socket.write('Error al crear editorial.\n');
            }
            return;
        }

        // GET BOOKS
        if (upperMessage === 'GET BOOKS') {
            const books = bookController.getBooks();
            socket.write(formatter.formatList(books, 'libros') + '\n');
            return;
        }

        // START interactive ADD BOOK
        if (upperMessage === 'ADD BOOK') {
            startInteraction(socket, 'ADD_BOOK');
            socket.currentInteraction.step = 1; // paso 1: título
            socket.write('ADD BOOK - Paso 1: Escribe el título del libro:\n');
            return;
        }

        // START interactive ADD AUTHOR (option C)
        if (upperMessage === 'ADD AUTHOR') {
            startInteraction(socket, 'ADD_AUTHOR');
            socket.currentInteraction.step = 1; // pedir nombre
            socket.write('ADD AUTHOR - Paso 1: Escribe el nombre del autor:\n');
            return;
        }

        // START interactive ADD PUBLISHER (option C)
        if (upperMessage === 'ADD PUBLISHER') {
            startInteraction(socket, 'ADD_PUBLISHER');
            socket.currentInteraction.step = 1; // pedir nombre
            socket.write('ADD PUBLISHER - Paso 1: Escribe el nombre de la editorial:\n');
            return;
        }

        // Si no coincide:
        socket.write('Comando no reconocido. Escribe HELP para ver comandos.\n');
    });

    socket.on('end', () => {
        console.log('Cliente desconectado');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

// ----------------------
// FLUJO: ADD BOOK (mantengo tu lógica, con nombres de variables claros)
// ----------------------
function handleAddBookFlow(socket, userInput) {
    const interaction = socket.currentInteraction;
    if (!interaction) return;

    // Paso 1: título
    if (interaction.step === 1) {
        interaction.temp.title = userInput;
        interaction.step = 2;
        socket.write('Paso 2: Escribe el año de publicación (ej: 1967):\n');
        return;
    }

    // Paso 2: año
    if (interaction.step === 2) {
        const parsedYear = parseInt(userInput, 10);
        if (isNaN(parsedYear)) {
            socket.write('Año inválido. Escribe un número (ej: 1967):\n');
            return;
        }
        interaction.temp.year = parsedYear;
        interaction.step = 3;
        // Mostrar autores disponibles (solo nombres) y pedir nombre
        const authors = authorController.getAuthors();
        socket.write('Paso 3: Ingresa nombre del autor (puedes copiar exactamente el nombre)\n');
        if (authors.length === 0) {
            socket.write('No hay autores registrados. Si el autor no existe, se te preguntará para crear uno.\n');
        } else {
            socket.write('Autores disponibles:\n' + formatter.formatList(authors, 'autores') + '\n');
        }
        return;
    }

    // Paso 3: nombre autor
    if (interaction.step === 3) {
        const authorNameInput = userInput;
        interaction.temp.authorName = authorNameInput;
        const foundAuthor = findAuthorByNameSafe(authorNameInput);
        if (foundAuthor) {
            interaction.temp.authorId = foundAuthor.id;
            interaction.step = 4;
            const publishers = publisherController.getPublishers();
            socket.write(`Autor encontrado: ${foundAuthor.name}\n`);
            socket.write('Paso 4: Ingresa nombre de la editorial (publisher).\n');
            if (publishers.length === 0) {
                socket.write('No hay editoriales registradas. Si la editorial no existe, se te preguntará para crear una.\n');
            } else {
                socket.write('Editoriales disponibles:\n' + formatter.formatList(publishers, 'editoriales') + '\n');
            }
            return;
        } else {
            interaction.step = 3.5; // preguntar crear autor
            socket.write(`Autor "${authorNameInput}" no encontrado. ¿Deseas crearlo? (Y/N)\n`);
            return;
        }
    }

    // Paso 3.5: respuesta si crear autor
    if (interaction.step === 3.5) {
        const answer = userInput.trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
            const createdAuthor = authorController.addAuthor({ name: interaction.temp.authorName });
            if (createdAuthor && !createdAuthor.error) {
                interaction.temp.authorId = createdAuthor.id;
                socket.write(`Autor creado: ${createdAuthor.name}\n`);
                interaction.step = 4;
                const publishers = publisherController.getPublishers();
                socket.write('Paso 4: Ingresa nombre de la editorial (publisher):\n');
                if (publishers.length === 0) {
                    socket.write('No hay editoriales registradas. Si la editorial no existe, se te preguntará para crear una.\n');
                } else {
                    socket.write('Editoriales disponibles:\n' + formatter.formatList(publishers, 'editoriales') + '\n');
                }
                return;
            } else {
                socket.write('Error creando autor. Intenta de nuevo o escribe CANCEL para cancelar.\n');
                interaction.step = 3;
                return;
            }
        } else if (answer === 'n' || answer === 'no') {
            interaction.step = 3; // volver a pedir nombre autor
            socket.write('Ok. Ingresa otro nombre de autor o escribe CANCEL para cancelar ADD BOOK:\n');
            return;
        } else {
            socket.write('Respuesta inválida. Responde Y o N:\n');
            return;
        }
    }

    // Paso 4: nombre editorial
    if (interaction.step === 4) {
        const publisherNameInput = userInput;
        interaction.temp.publisherName = publisherNameInput;
        const foundPublisher = findPublisherByNameSafe(publisherNameInput);
        if (foundPublisher) {
            interaction.temp.publisherId = foundPublisher.id;
            interaction.step = 5;
            // confirmamos todo y guardamos
            finalizeBookCreation(socket);
            return;
        } else {
            interaction.step = 4.5; // preguntar crear publisher
            socket.write(`Editorial "${publisherNameInput}" no encontrada. ¿Deseas crearla? (Y/N)\n`);
            return;
        }
    }

    // Paso 4.5: respuesta si crear editorial
    if (interaction.step === 4.5) {
        const answer = userInput.trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
            const createdPublisher = publisherController.addPublisher({ name: interaction.temp.publisherName });
            if (createdPublisher && !createdPublisher.error) {
                interaction.temp.publisherId = createdPublisher.id;
                socket.write(`Editorial creada: ${createdPublisher.name}\n`);
                interaction.step = 5;
                finalizeBookCreation(socket);
                return;
            } else {
                socket.write('Error creando editorial. Intenta de nuevo o escribe CANCEL para cancelar.\n');
                interaction.step = 4;
                return;
            }
        } else if (answer === 'n' || answer === 'no') {
            interaction.step = 4; // volver a pedir publisher name
            socket.write('Ok. Ingresa otro nombre de editorial o escribe CANCEL para cancelar ADD BOOK:\n');
            return;
        } else {
            socket.write('Respuesta inválida. Responde Y o N:\n');
            return;
        }
    }

    // Si llegamos hasta aquí: entrada inesperada
    socket.write('Entrada no esperada. Escribe CANCEL para cancelar o continua según las instrucciones.\n');
}

// ----------------------
// FLUJO: ADD AUTHOR (opción C: busca por nombre, si no existe pregunta crear)
// ----------------------
function handleAddAuthorFlow(socket, userInput) {
    const interaction = socket.currentInteraction;
    if (!interaction) return;

    // Paso 1: recibimos nombre
    if (interaction.step === 1) {
        const authorNameInput = userInput.trim();
        interaction.temp.authorName = authorNameInput;

        // verificar si existe
        const foundAuthor = findAuthorByNameSafe(authorNameInput);
        if (foundAuthor) {
            socket.write(`El autor "${foundAuthor.name}" ya existe.\n`);
            // terminamos la interacción (podrías permitir reintento, aquí terminamos para simplicidad)
            resetInteraction(socket);
            return;
        }

        // Si no existe, preguntar si crear
        interaction.step = 1.5;
        socket.write(`Autor "${authorNameInput}" no encontrado. ¿Deseas crearlo? (Y/N)\n`);
        return;
    }

    // Paso 1.5: respuesta si crear
    if (interaction.step === 1.5) {
        const answer = userInput.trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
            const createdAuthor = authorController.addAuthor({ name: interaction.temp.authorName });
            if (createdAuthor && !createdAuthor.error) {
                socket.write(`✔️ Autor creado correctamente: ${createdAuthor.name}\n`);
            } else {
                socket.write('Error creando autor.\n');
            }
            resetInteraction(socket);
            return;
        } else if (answer === 'n' || answer === 'no') {
            socket.write('Proceso cancelado. Si quieres intentarlo de nuevo escribe ADD AUTHOR.\n');
            resetInteraction(socket);
            return;
        } else {
            socket.write('Respuesta inválida. Responde Y o N:\n');
            return;
        }
    }
}

// ----------------------
// FLUJO: ADD PUBLISHER (opción C: busca por nombre, si no existe pregunta crear)
// ----------------------
function handleAddPublisherFlow(socket, userInput) {
    const interaction = socket.currentInteraction;
    if (!interaction) return;

    // Paso 1: recibimos nombre
    if (interaction.step === 1) {
        const publisherNameInput = userInput.trim();
        interaction.temp.publisherName = publisherNameInput;

        // verificar si existe
        const foundPublisher = findPublisherByNameSafe(publisherNameInput);
        if (foundPublisher) {
            socket.write(`La editorial "${foundPublisher.name}" ya existe.\n`);
            resetInteraction(socket);
            return;
        }

        // Si no existe, preguntar si crear
        interaction.step = 1.5;
        socket.write(`Editorial "${publisherNameInput}" no encontrada. ¿Deseas crearla? (Y/N)\n`);
        return;
    }

    // Paso 1.5: respuesta si crear
    if (interaction.step === 1.5) {
        const answer = userInput.trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
            const createdPublisher = publisherController.addPublisher({ name: interaction.temp.publisherName });
            if (createdPublisher && !createdPublisher.error) {
                socket.write(`✔️ Editorial creada correctamente: ${createdPublisher.name}\n`);
            } else {
                socket.write('Error creando editorial.\n');
            }
            resetInteraction(socket);
            return;
        } else if (answer === 'n' || answer === 'no') {
            socket.write('Proceso cancelado. Si quieres intentarlo de nuevo escribe ADD PUBLISHER.\n');
            resetInteraction(socket);
            return;
        } else {
            socket.write('Respuesta inválida. Responde Y o N:\n');
            return;
        }
    }
}

// ----------------------
// finalizeBookCreation (usa controllers y muestra nombres bonitos)
// ----------------------
function finalizeBookCreation(socket) {
    const interaction = socket.currentInteraction;
    if (!interaction) return;

    const bookPayload = {
        title: interaction.temp.title,
        year: interaction.temp.year,
        authorId: interaction.temp.authorId,
        publisherId: interaction.temp.publisherId
    };

    const createdBook = bookController.addBook(bookPayload);
    if (createdBook && !createdBook.error) {
        const author = authorController.getAuthors().find(a => a.id === createdBook.authorId);
        const publisher = publisherController.getPublishers().find(p => p.id === createdBook.publisherId);

        socket.write(
            '   ✔️ Libro agregado correctamente:\n' +
            `   📚 Título: ${createdBook.title}\n` +
            `   🗓️ Año: ${createdBook.year}\n` +
            `   ✍️ Autor: ${author ? author.name : 'Desconocido'}\n` +
            `   🏢 Editorial: ${publisher ? publisher.name : 'Desconocida'}\n\n`
        );
    } else {
        socket.write('Error al crear el libro. Revisa datos e intenta de nuevo.\n');
    }

    resetInteraction(socket);
}

server.listen(8080, () => {
    console.log('Servidor TCP escuchando en puerto 8080');
});