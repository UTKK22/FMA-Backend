const express = require('express');
const app = require('express')();
app.use(express.json());
const bcrypt = require('bcryptjs');
const isAuth = require('./routes/Auth.js');
const bodyParser = require('body-parser');
const router = express.Router();
const Product = require('./models/Products.js');
const Category = require('./models/Category.js'); 
const jwt = require('jsonwebtoken');
const cors = require('cors'); 
const Address = require('./models/Address.js')


app.use(cors({
  origin: ['http://localhost:5173', 'https://fma-frontend.onrender.com'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
// app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

const User = require('./models/User.js');
const JWT_SECRET = "verifytoken";


const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://admin:admin@cluster0.jpkgl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(console.log("db connect"));

app.listen(3000,function(){
  console.log('listening on port 3000');
});



// userSignup endpoint
app.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  console.log('Signup request received:', req.body);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, phone});
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
 console.log({newUser})
    res.status(201).json({ 
      user: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      }, 
      token 
    });
    
  } catch (error) {
    console.log("inide catch block ")
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/user/:email',isAuth, async (req, res) => {
  try {
    console.log("entering in fetch");
    // Ensure the email in the route parameter matches the logged-in user's email
    if (req.user.email !== req.params.email) {
      return res.status(403).send('You can only access your own data');
    }

    // Retrieve the user from the database based on email
    const user = await User.findOne({ email: req.params.email });
    console.log({user});
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Exclude the password field from the response
    const { password, ...userData } = user.toObject();
    
    res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received:', req.body);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/profile', isAuth, async (req, res) => {
  try {
      const user = await User.findById(req.user.userId); 
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          nationality: user.nationality,
          photo: user.photo,
          cards: user.cards || []
      });
  } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
app.put('/profile', isAuth, async (req, res) => {
  try {
      const { name, email, gender, nationality, photo } = req.body;
      const user = await User.findById(req.user.userId);
      console.log({user});
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.gender = gender || user.gender;
      user.nationality = nationality || user.nationality;
      user.photo = photo || user.photo;

      await user.save();

      res.status(200).json({
          name: user.name,
          email: user.email,
          gender: user.gender,
          nationality: user.nationality,
          photo: user.photo
      });
  } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/cards', isAuth, async (req, res) => {
  try {
      const {cvv,nameOnCard,cardName, cardNumber, expiryDate } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      user.cards.push({ cvv,nameOnCard,cardName,cardNumber, expiryDate });
      await user.save();

      res.status(201).json({ cardNumber, expiryDate,cvv,cardName,nameOnCard  });
  } catch (error) {
      console.error('Error adding card:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/cards', async (req, res) => {
  const userId = req.user.id; 
  const { card } = req.body; 

  try {
   
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { cards: card } }, 
      { new: true } 
    );

    res.status(200).json(updatedUser.cards); 
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ error: "Failed to add card" });
  }
});

app.get('/cards', isAuth, async (req, res) => {
  try {
      const user = await User.findById(req.user.userId);

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(user.cards || []);
  } catch (error) {
      console.error('Error fetching cards:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete('/cards/:index', isAuth, async (req, res) => {
  try {
      const { index } = req.params;
      const user = await User.findById(req.user.userId);

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      if (index >= 0 && index < user.cards.length) {
          user.cards.splice(index, 1); // Remove card at index
          await user.save();
          res.status(200).json({ message: 'Card deleted successfully' });
      } else {
          res.status(400).json({ error: 'Invalid card index' });
      }
  } catch (error) {
      console.error('Error deleting card:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/categories', async (req, res) => {
  const categories = await Category.find().populate('products');
  res.json(categories);
});


app.get('/products', async (req, res) => {
  const products = await Product.find().populate('category');
  res.json(products);
});


app.get('/categories/:id/products', async (req, res) => {
  const category = await Category.findById(req.params.id).populate('products');
  res.json(category.products);
});

app.get('/food', async (req, res) => {
  try {
    console.log("enetring in try");
    const categories = await Category.find().populate('products');
    res.json(categories); 
  } catch (error) {
    console.log("enetring in catch");
    res.status(500).json({ error: 'Failed to fetch food items from backend' });
  }
});

app.get("/addresses/:userId", isAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    const addresses = await Address.find({ userId }).sort();
    if (!addresses.length) {
      return res.status(404).json({ error: "No addresses found" });
    }
    res.status(200).json(addresses);
  } catch (err) {
    res.status(500).json({ error: "Error fetching addresses", details: err.message });
  }
});


app.post("/addresses", isAuth, async (req, res) => {
  const { userId, address, city, state, pincode, phone, isDefault } = req.body;

  if (!userId || !address || !city || !state || !pincode || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    if (isDefault) {
      // Unset the default flag for all other addresses
      await Address.updateMany({ userId }, { isDefault: false });
    }

    // Create the new address
    const newAddress = new Address({ userId, address, city, state, pincode, phone, isDefault });
    await newAddress.save();

    res.status(201).json({ message: "Address added successfully", address: newAddress });
  } catch (err) {
    res.status(500).json({ error: "Error adding address", details: err.message });
  }
});


