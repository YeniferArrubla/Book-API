const authorModel = require('../models/authorModel');

// Handler para GET AUTHORS
function getAuthors() {
    console.log('Controller: getAuthors()');
    return authorModel.getAllAuthors();
}

// Handler para ADD AUTHOR (recibe un objeto)
function addAuthor(authorData) {
    if (!authorData || !authorData.name) {
        return { error: 'Faltan datos: name es obligatorio' };
    }

    console.log('Controller: addAuthor()');
    const created = authorModel.addAuthor(authorData);
    if (!created) return { error: 'Error al guardar autor' };
    return created;
}

function findAuthorByName(name) {
  return authorModel.findAuthorByName(name);
}

module.exports = {
    getAuthors,
    addAuthor,
    findAuthorByName,
};