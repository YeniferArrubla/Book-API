const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Necesario para generar IDs únicos

// 1. Ruta absoluta al archivo JSON de autores
const AUTHORS_FILE = path.join(__dirname, '..', 'data', 'authors.json');

// --- Función base para LEER datos ---
function getAuthors() {
    try {
        const data = fs.readFileSync(AUTHORS_FILE, 'utf8');
        // Si está vacío, devuelve un array vacío
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error al leer authors.json:', error.message);
        return [];
    }
}

// --- Función base para ESCRIBIR datos ---
function saveAuthors(authors) {
    try {
        // Convierte el array de JavaScript a una cadena JSON con formato legible (null, 2)
        const data = JSON.stringify(authors, null, 2); 
        fs.writeFileSync(AUTHORS_FILE, data, 'utf8');
        return true;
    } catch (error) {
        console.error('Error al escribir en authors.json:', error.message);
        return false;
    }
}

// --- Implementación del comando GET AUTHORS ---
function getAllAuthors() {
    return getAuthors();
}

// --- Implementación del comando ADD AUTHOR ---
function addAuthor(authorData) {
    const authors = getAuthors();
    
    // 1. Crea el nuevo objeto autor
    const newAuthor = { 
        id: uuidv4(), 
        ...authorData 
    };
    
    // 2. Añade el nuevo autor al array
    authors.push(newAuthor);
    
    // 3. Guarda el array actualizado en el JSON
    if (saveAuthors(authors)) {
        return newAuthor; // Retorna el autor creado si se guardó correctamente
    }
    return null; // Retorna null si hubo un error al guardar
}

// Busca autor por nombre (case-insensitive)
function findAuthorByName(name) {
  if (!name) 
    return null;
  const authors = getAuthors();
  return authors.find(a => a.name && a.name.toLowerCase() === name.toLowerCase()) || null;
}

// Exportamos las funciones para que el controlador pueda usarlas
module.exports = {
    getAllAuthors,
    addAuthor,
    findAuthorByName,
};