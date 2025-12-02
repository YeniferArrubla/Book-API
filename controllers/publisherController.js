// controllers/publisherController.js
const publisherModel = require('../models/publisherModel');

function getPublishers() {
    console.log('Controller: getPublishers()');
    return publisherModel.getAllPublishers();
}

function addPublisher(publisherData) {
    if (!publisherData || !publisherData.name) {
        return { error: 'Faltan datos: name es obligatorio' };
    }

    console.log('Controller: addPublisher()');
    const created = publisherModel.addPublisher(publisherData);
    if (!created) return { error: 'Error al guardar editorial' };
    return created;
}

function findPublisherByName(name) {
  return publisherModel.findPublisherByName(name);
}

module.exports = {
    getPublishers,
    addPublisher,
    findPublisherByName,
};