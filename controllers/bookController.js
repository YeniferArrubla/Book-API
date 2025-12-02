// controllers/bookController.js
const bookModel = require('../models/booksModel');

function getBooks() {
    console.log('Controller: getBooks()');
    return bookModel.getAllBooks();
}

function addBook(bookData) {
    // validación mínima: title
    if (!bookData || !bookData.title) {
        return { error: 'Faltan datos: title es obligatorio' };
    }
    console.log('Controller: addBook()');
    const created = bookModel.addBook(bookData);
    if (!created) return { error: 'Error al guardar libro' };
    return created;
}

module.exports = {
    getBooks,
    addBook
};
