import express from 'express';
import { getClients, createClient, deleteClient, updateClient } from '../controllers/clientController.js';

const router = express.Router();

router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
