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

function addBook(bookData) {
    try {
        const books = readBooks();
        const newBook = { id: uuidv4(), ...bookData };
        books.push(newBook);

        return saveBooks(books) ? newBook : null;
    } catch (error) {
        console.error('Error adding new book:', error.message);
        return null;
    }
}

function findBookByTitle(title) {
    if (!title) return null;

    try {
        const books = readBooks();
        return books.find(b => b.title?.toLowerCase() === title.toLowerCase()) || null;
    } catch (error) {
        console.error('Error searching book by title:', error.message);
        return null;
    }
}

module.exports = {
    getAllBooks,
    addBook,
    findBookByTitle,
};
