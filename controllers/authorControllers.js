const authorModel = require('../models/authorModel');

// Handler para el comando 'GET AUTHORS'
function handleGetAllAuthors() {
    console.log('Controlador: Solicitando todos los autores...');
    return authorModel.getAllAuthors();
}

// Handler para el comando 'ADD AUTHOR'
function handleAddAuthor(authorData) {
    //  Importante: Agregamos una validación mínima
    if (!authorData || !authorData.name) {
        return { error: 'Faltan datos requeridos para agregar un autor (ej: name).' };
    }
    
    console.log('Controlador: Agregando nuevo autor...');
    return authorModel.addAuthor(authorData);
}

module.exports = {
    handleGetAllAuthors,
    handleAddAuthor,
    // Aquí irían los handlers para buscar, actualizar y eliminar autores.
};