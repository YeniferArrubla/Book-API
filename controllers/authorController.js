const authorModel = require('../models/authorModel');

// Listar autores (devuelve array o { error })
function listAuthors() {
    try {
        console.log('controller: listAuthors()');
        return authorModel.getAllAuthors();
    } catch (error) {
        console.error('Controller error listAuthors:', error.message);
        return { error: 'Error interno al listar autores' };
    }
}

// Añadir autor (valida duplicado por nombre)
function addAuthor(authorData) {
    try {
        console.log('controller: addAuthor()');
        if (!authorData || !authorData.name) {
            return { error: 'Falta name para crear autor' };
        }

        const existing = authorModel.findAuthorByName(authorData.name);
        if (existing) {
            return { error: 'Autor ya existe' };
        }

        const created = authorModel.addAuthor(authorData);
        if (!created) return { error: 'Error al guardar autor' };
        return created;
    } catch (error) {
        console.error('Controller error addAuthor:', error.message);
        return { error: 'Error al crear autor' };
    }
}

// Buscar autor por nombre (para comando SEARCH AUTHOR)
function searchAuthorByName(term) {
    try {
        console.log('controller: searchAuthorByName()');
        if (!term) return [];
        const found = authorModel.findAuthorByName(term);
        // findAuthorByName devuelve un objeto o null; devolvemos array para consistencia
        return found ? [found] : [];
    } catch (error) {
        console.error('Controller error searchAuthorByName:', error.message);
        return [];
    }
}

module.exports = {
    listAuthors,
    addAuthor,
    searchAuthorByName
};
