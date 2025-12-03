const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PUBLISHERS_FILE = path.join(__dirname, '..', 'data', 'publishers.json');

function readPublishers() {
    try {
        const data = fs.readFileSync(PUBLISHERS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading publishers.json:', error.message);
        return [];
    }
}

function savePublishers(publishers) {
    try {
        fs.writeFileSync(PUBLISHERS_FILE, JSON.stringify(publishers, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to publishers.json:', error.message);
        return false;
    }
}

function getAllPublishers() {
    return readPublishers();
}

function addPublisher(publisherData) {
    try {
        const publishers = readPublishers();
        const newPublisher = { id: uuidv4(), ...publisherData };
        publishers.push(newPublisher);

        return savePublishers(publishers) ? newPublisher : null;
    } catch (error) {
        console.error('Error adding new publisher:', error.message);
        return null;
    }
}

function findPublisherByName(name) {
    if (!name) return null;

    try {
        const publishers = readPublishers();
        return publishers.find(p => p.name?.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
        console.error('Error searching publisher by name:', error.message);
        return null;
    }
}

module.exports = {
    getAllPublishers,
    addPublisher,
    findPublisherByName,
};
