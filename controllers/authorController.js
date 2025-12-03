const authorModel = require('../models/authorModel');

function listAuthors() {
    try {
        return authorModel.getAllAuthors();
    } catch (error) {
        return { error: 'Error listing authors: ' + error.message };
    }
}

function addAuthor(authorData) {
    try {
        // --- Duplicate validation ---
        const exists = authorModel.findAuthorByName(authorData.name);
        if (exists) {
            return { error: 'Author already exists' };
        }

        return authorModel.addAuthor(authorData);
    } catch (error) {
        return { error: 'Error adding author: ' + error.message };
    }
}

function getAuthorById(id) {
    try {
        const author = authorModel.findAuthorById(id);
        if (!author) {
            return { error: 'Author not found' };
        }
        return author;
    } catch (error) {
        return { error: 'Error fetching author: ' + error.message };
    }
}

function updateAuthor(id, newData) {
    try {
        const updated = authorModel.updateAuthor(id, newData);
        if (!updated) {
            return { error: 'Author not found' };
        }
        return updated;
    } catch (error) {
        return { error: 'Error updating author: ' + error.message };
    }
}

function deleteAuthor(id) {
    try {
        const deleted = authorModel.deleteAuthor(id);
        if (!deleted) {
            return { error: 'Author not found' };
        }
        return deleted;
    } catch (error) {
        return { error: 'Error deleting author: ' + error.message };
    }
}

module.exports = {
    listAuthors,
    addAuthor,
    getAuthorById,
    updateAuthor,
    deleteAuthor
};
