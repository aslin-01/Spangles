import Client from '../models/Client.js';

// Get all clients
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};

// Create a new client
export const createClient = async (req, res) => {
  try {
    const { 
      name, email, phone, address, 
      businessName, businessEmail, businessPhone, businessAddress 
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newClient = new Client({
      name, email, phone, address,
      businessName, businessEmail, businessPhone, businessAddress
    });

    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
  } catch (error) {
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
};

// Delete a client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedClient = await Client.findByIdAndDelete(id);
    
    if (!deletedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};
