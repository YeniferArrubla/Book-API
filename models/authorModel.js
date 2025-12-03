const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const AUTHORS_FILE = path.join(__dirname, '..', 'data', 'authors.json');

function readAuthors() {
    try {
        const data = fs.readFileSync(AUTHORS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading authors.json:', error.message);
        return [];
    }
}

function saveAuthors(authors) {
    try {
        fs.writeFileSync(AUTHORS_FILE, JSON.stringify(authors, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to authors.json:', error.message);
        return false;
    }
}

function getAllAuthors() {
    return readAuthors();
}

function addAuthor(authorData) {
    try {
        const authors = readAuthors();
        const newAuthor = { id: uuidv4(), ...authorData };
        authors.push(newAuthor);

        return saveAuthors(authors) ? newAuthor : null;
    } catch (error) {
        console.error('Error adding new author:', error.message);
        return null;
    }
}

function findAuthorByName(name) {
    if (!name) return null;

    try {
        const authors = readAuthors();
        return authors.find(a => a.name?.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
        console.error('Error searching author by name:', error.message);
        return null;
    }
}

module.exports = {
    getAllAuthors,
    addAuthor,
    findAuthorByName,
};
