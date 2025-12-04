const bookModel = require('../models/booksModel');
const authorModel = require('../models/authorModel');
const publisherModel = require('../models/publisherModel');

// Listar libros
function listBooks() {
    try {
        console.log('controller: listBooks()');
        return bookModel.getAllBooks();
    } catch (error) {
        console.error('Controller error listBooks:', error.message);
        return { error: 'Error interno al listar libros' };
    }
}

// Añadir libro; recibe { title, year, authorName, publisherName }
// Crea autor/editorial si no existen y usa sus ids
function addBook(data) {
    try {
        console.log('controller: addBook()');

        const title = (data.title || '').trim();
        const year = data.year;
        const authorName = (data.authorName || '').trim();
        const publisherName = (data.publisherName || '').trim();

        if (!title) return { error: 'Falta title' };
        if (!year) return { error: 'Falta year' };
        if (!authorName) return { error: 'Falta authorName' };
        if (!publisherName) return { error: 'Falta publisherName' };

        // Buscar/crear autor
        let author = authorModel.findAuthorByName(authorName);
        if (!author) {
            author = authorModel.addAuthor({ name: authorName });
            if (!author) return { error: 'No se pudo crear autor' };
        }

        // Buscar/crear editorial
        let publisher = publisherModel.findPublisherByName(publisherName);
        if (!publisher) {
            publisher = publisherModel.addPublisher({ name: publisherName });
            if (!publisher) return { error: 'No se pudo crear editorial' };
        }

        // Validar duplicado: mismo título y mismo authorId
        const allBooks = bookModel.getAllBooks();
        const duplicate = allBooks.find(b =>
            b.title && b.title.toLowerCase() === title.toLowerCase() &&
            b.authorId === author.id
        );
        if (duplicate) return { error: 'El libro ya existe para ese autor' };

        // Crear libro (bookModel genera id)
        const created = bookModel.addBook({
            title,
            year,
            authorId: author.id,
            authorName: author.name,
            publisherId: publisher.id,
            publisherName: publisher.name
        });

        if (!created) return { error: 'Error al guardar libro' };

        return created;
    } catch (error) {
        console.error('Controller error addBook:', error.message);
        return { error: 'Error interno al agregar libro' };
    }
}

// Buscar libros por término (título o autor) -> devuelve array
function searchBooks(term) {
    try {
        console.log('controller: searchBooks()');
        if (!term) return [];
        return bookModel.searchBooksByTerm(term);
    } catch (error) {
        console.error('Controller error searchBooks:', error.message);
        return [];
    }
}

module.exports = {
    listBooks,
    addBook,
    searchBooks
};
