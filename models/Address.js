const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  address1: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: Number, required: true },
  phone: { type: String, required: true },
  isDefault: { type: String, default: "Regent Street, A4, A4201, London" },
});

module.exports = mongoose.model("Address", AddressSchema);
