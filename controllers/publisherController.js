const publisherModel = require('../models/publisherModel');

function listPublishers() {
    try {
        return publisherModel.getAllPublishers();
    } catch (error) {
        return { error: 'Error al listar las editoriales: ' + error.message };
    }
}

function addPublisher(publisherData) {
    try {
        // Validación de duplicado
        const exists = publisherModel.findPublisherByName(publisherData.name);
        if (exists) {
            return { error: 'La editorial ya existe' };
        }

        return publisherModel.addPublisher(publisherData);
    } catch (error) {
        return { error: 'Error al agregar la editorial: ' + error.message };
    }
}

function getPublisherById(id) {
    try {
        const publisher = publisherModel.findPublisherById(id);
        if (!publisher) {
            return { error: 'Editorial no encontrada' };
        }
        return publisher;
    } catch (error) {
        return { error: 'Error al obtener la editorial: ' + error.message };
    }
}

function updatePublisher(id, newData) {
    try {
        const updated = publisherModel.updatePublisher(id, newData);
        if (!updated) {
            return { error: 'Editorial no encontrada' };
        }
        return updated;
    } catch (error) {
        return { error: 'Error al actualizar la editorial: ' + error.message };
    }
}

function deletePublisher(id) {
    try {
        const deleted = publisherModel.deletePublisher(id);
        if (!deleted) {
            return { error: 'Editorial no encontrada' };
        }
        return deleted;
    } catch (error) {
        return { error: 'Error al eliminar la editorial: ' + error.message };
    }
}

module.exports = {
    listPublishers,
    addPublisher,
    getPublisherById,
    updatePublisher,
    deletePublisher
};
