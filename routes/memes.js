const express = require('express');
const router = express.Router();
const memesController = require('../controllers/memesController');
const upload = require('../middleware/upload');
const { validateMemeData } = require('../middleware/validator');

router.get('/', memesController.getAllMemes);

router.get('/:id', memesController.getMemeById);

router.post('/', upload.single('image'), validateMemeData, memesController.createMeme);

router.put('/:id', validateMemeData, memesController.updateMeme);

router.delete('/:id', memesController.deleteMeme);

module.exports = router;

