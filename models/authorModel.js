const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const AUTHORS_FILE = path.join(__dirname, '..', 'data', 'authors.json');

// Leer autores desde archivo (manejo de errores)
function readAuthors() {
    try {
        const data = fs.readFileSync(AUTHORS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading authors.json:', error.message);
        return [];
    }
}

// Guardar autores en archivo (manejo de errores)
function saveAuthors(authors) {
    try {
        fs.writeFileSync(AUTHORS_FILE, JSON.stringify(authors, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to authors.json:', error.message);
        return false;
    }
}

// Obtener todos los autores
function getAllAuthors() {
    return readAuthors();
}

// Añadir un autor (genera id automáticamente)
function addAuthor(authorData) {
    try {
        const authors = readAuthors();

        // Normalizar nombre
        const nameNormalized = (authorData.name || '').trim();

        // Crear nuevo autor
        const newAuthor = {
            id: uuidv4(),
            name: nameNormalized
        };

        authors.push(newAuthor);

        return saveAuthors(authors) ? newAuthor : null;
    } catch (error) {
        console.error('Error adding new author:', error.message);
        return null;
    }
}

// Buscar autor por nombre (case-insensitive exact match)
function findAuthorByName(name) {
    if (!name) return null;
    try {
        const authors = readAuthors();
        const target = name.trim().toLowerCase();
        return authors.find(a => a.name && a.name.toLowerCase() === target) || null;
    } catch (error) {
        console.error('Error searching author by name:', error.message);
        return null;
    }
}

// Buscar autor por id
function findAuthorById(id) {
    if (!id) return null;
    try {
        const authors = readAuthors();
        return authors.find(a => a.id === id) || null;
    } catch (error) {
        console.error('Error searching author by id:', error.message);
        return null;
    }
}

module.exports = {
    getAllAuthors,
    addAuthor,
    findAuthorByName,
    findAuthorById
};
