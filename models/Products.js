const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
  name: String,
  description: String,
  price: String,
  image: String,
  category:{ type: Schema.Types.ObjectId, ref: 'Category' },
});

module.exports = mongoose.model('Product', productSchema);