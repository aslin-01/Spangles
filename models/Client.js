import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  clientId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  address: { type: String, required: false },
  businessName: { type: String, required: false },
  businessEmail: { type: String, required: false },
  businessPhone: { type: String, required: false },
  businessAddress: { type: String, required: false },
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);
export default Client;
