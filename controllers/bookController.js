// controllers/bookController.js
const bookModel = require('../models/booksModel');
const authorModel = require('../models/authorModel');
const publisherModel = require('../models/publisherModel');

function listBooks() {
    return bookModel.getAllBooks();
}

function addBook(data) {
    const { title, year, authorName, publisherName } = data;

    if (!title) return { error: 'Falta el título' };
    if (!year) return { error: 'Falta el año' };
    if (!authorName) return { error: 'Falta el nombre del autor' };
    if (!publisherName) return { error: 'Falta el nombre de la editorial' };

    // Buscar autor
    let author = authorModel.findAuthorByName(authorName);

    // Si no existe → crearlo
    if (!author) {
        author = authorModel.addAuthor({ name: authorName });
    }

    // Buscar editorial
    let publisher = publisherModel.findPublisherByName(publisherName);

    // Si no existe → crearla
    if (!publisher) {
        publisher = publisherModel.addPublisher({ name: publisherName });
    }

    // Validar duplicado del libro (título + autor)
    const allBooks = bookModel.getAllBooks();
    const duplicate = allBooks.find(
        (b) =>
            b.title.toLowerCase() === title.toLowerCase() &&
            b.authorId === author.id
    );

    if (duplicate) {
        return { error: 'El libro ya existe con ese autor.' };
    }

    // Crear libro con ids automáticos
    const created = bookModel.addBook({
        title,
        year,
        authorId: author.id,
        authorName: author.name,
        publisherId: publisher.id,
        publisherName: publisher.name
    });

    return created || { error: 'Error al guardar el libro' };
}

module.exports = {
    listBooks,
    addBook
};
