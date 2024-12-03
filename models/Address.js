const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: Number, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: true},
});

module.exports = mongoose.model("Address", AddressSchema);
