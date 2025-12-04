const publisherModel = require('../models/publisherModel');

// Listar editoriales
function listPublishers() {
    try {
        console.log('controller: listPublishers()');
        return publisherModel.getAllPublishers();
    } catch (error) {
        console.error('Controller error listPublishers:', error.message);
        return { error: 'Error interno al listar editoriales' };
    }
}

// Añadir editorial (valida duplicado)
function addPublisher(publisherData) {
    try {
        console.log('controller: addPublisher()');
        if (!publisherData || !publisherData.name) return { error: 'Falta name' };

        const existing = publisherModel.findPublisherByName(publisherData.name);
        if (existing) return { error: 'Editorial ya existe' };

        const created = publisherModel.addPublisher(publisherData);
        if (!created) return { error: 'Error al guardar editorial' };
        return created;
    } catch (error) {
        console.error('Controller error addPublisher:', error.message);
        return { error: 'Error interno al crear editorial' };
    }
}

module.exports = {
    listPublishers,
    addPublisher
};
