const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type:String,
        required:true
    },
    phone: {
        type: String,
        required: true
    },
    gender: { type: String,default:"Male" }, 
    nationality: { type: String,default: "Indian" }, 
    photo: { type:String,default:"Photo"}, 
    cards: [
        { cardName:{type:String},nameOnCard:{type:String},cvv:{type:Number},cardNumber: { type: Number }, expiryDate: { type: String } } 
    ],
   
});

const User = mongoose.model('User', userSchema);
module.exports = User;
