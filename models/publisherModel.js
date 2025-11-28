const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 

// Ruta al archivo JSON de editoriales
const PUBLISHERS_FILE = path.join(__dirname, '..', 'data', 'publishers.json');

// Función para LEER el archivo JSON
function getPublishers() {
    try {
        const data = fs.readFileSync(PUBLISHERS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error al leer publishers.json:', error.message);
        return [];
    }
}

// Función para ESCRIBIR en el archivo JSON
function savePublishers(publishers) {
    try {
        const data = JSON.stringify(publishers, null, 2);
        fs.writeFileSync(PUBLISHERS_FILE, data, 'utf8');
        return true;
    } catch (error) {
        console.error('Error al escribir en publishers.json:', error.message);
        return false;
    }
}

// Implementación de la función requerida (GET PUBLISHERS)
function getAllPublishers() {
    return getPublishers();
}

// Implementación de la función requerida (ADD PUBLISHER)
function addPublisher(publisherData) {
    const publishers = getPublishers();
    
    // Validar si ya existe un campo id en el JSON, sino genera uno nuevo
    const newPublisher = { 
        id: uuidv4(), 
        ...publisherData 
    };
    
    publishers.push(newPublisher);
    
    if (savePublishers(publishers)) {
        return newPublisher;
    }
    return null;
}

module.exports = {
    getAllPublishers,
    addPublisher,
    // Aquí agregarías findPublisherById, updatePublisher, etc.
};