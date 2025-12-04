const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BOOKS_FILE = path.join(__dirname, '..', 'data', 'books.json');

function readBooks() {
    try {
        const data = fs.readFileSync(BOOKS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading books.json:', error.message);
        return [];
    }
}

function saveBooks(books) {
    try {
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to books.json:', error.message);
        return false;
    }
}

function getAllBooks() {
    return readBooks();
}

// Añadir libro (genera id automáticamente); bookData debe contener authorId/publisherId y los nombres opcionales
function addBook(bookData) {
    try {
        const books = readBooks();

        const newBook = {
            id: uuidv4(),
            title: (bookData.title || '').trim(),
            year: bookData.year,
            authorId: bookData.authorId,
            authorName: bookData.authorName || '',
            publisherId: bookData.publisherId,
            publisherName: bookData.publisherName || ''
        };

        books.push(newBook);

        return saveBooks(books) ? newBook : null;
    } catch (error) {
        console.error('Error adding new book:', error.message);
        return null;
    }
}

// Buscar libro por título (exact match, case-insensitive)
function findBookByTitle(title) {
    if (!title) return null;
    try {
        const books = readBooks();
        const target = title.trim().toLowerCase();
        return books.find(b => b.title && b.title.toLowerCase() === target) || null;
    } catch (error) {
        console.error('Error searching book by title:', error.message);
        return null;
    }
}

// Buscar libros por término (title o authorName contiene término) -> devuelve array
function searchBooksByTerm(term) {
    if (!term) return [];
    try {
        const books = readBooks();
        const q = term.trim().toLowerCase();
        return books.filter(b =>
            (b.title && b.title.toLowerCase().includes(q)) ||
            (b.authorName && b.authorName.toLowerCase().includes(q))
        );
    } catch (error) {
        console.error('Error searching books by term:', error.message);
        return [];
    }
}

module.exports = {
    getAllBooks,
    addBook,
    findBookByTitle,
    searchBooksByTerm
};
