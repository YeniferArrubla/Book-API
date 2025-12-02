// models/booksModel.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BOOKS_FILE = path.join(__dirname, '..', 'data', 'books.json');

function getBooks() {
    try {
        const data = fs.readFileSync(BOOKS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error al leer books.json:', error.message);
        return [];
    }
}

function saveBooks(books) {
    try {
        fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error al escribir books.json:', error.message);
        return false;
    }
}

function getAllBooks() {
    return getBooks();
}

function addBook(bookData) {
    const books = getBooks();
    const newBook = { id: uuidv4(), ...bookData };
    books.push(newBook);
    if (saveBooks(books)) return newBook;
    return null;
}

module.exports = {
    getAllBooks,
    addBook
};
