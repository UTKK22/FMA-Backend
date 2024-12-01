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


app.use(cors());
// proj name: Food-delivery-app-debak-tanmay
// userId: fooddelivery2024
// password: debaktanmayproj2024
app.use(express.json());

const User = require('./models/User.js');
const JWT_SECRET = "verifytoken";

// schema required: User(login, signup), admin(login, signup), category,


// mongodb atlas connection
const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/food").then(console.log("db connect"));

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
      { expiresIn: '1h' }
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
      { expiresIn: '1h' }
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

      res.status(201).json({  cardNumber, expiryDate,cvv,cardName,nameOnCard  });
  } catch (error) {
      console.error('Error adding card:', error);
      res.status(500).json({ error: 'Internal server error' });
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



//adding products and categories

//Create a product
app.post('/products', async (req, res) => {
  const { name, description, price, img } = req.body;
  try {
    const product = new Product({ name, description, price, img });
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Create a category and associate a product
app.post('/categories', async (req, res) => {
  const { name, productId } = req.body;
  try {
    // Check if productId exists
    const existingProduct = await Product.findById(mongoose.Types.ObjectId(productId));
    if (!existingProduct) {
      return res.status(404).send({ message: 'Product not found' });
    }

    // Create the category and associate the product
    const category = new Category({ name, products: [productId] });
    await category.save();

    res.status(201).send(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).send(error);
  }
});

app.post('/categories', async (req, res) => {
  const { name, productId } = req.body;

  try {
    // Check if productId exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).send({ message: 'Product not found' });
    }

    // Create the category and associate the product
    const category = new Category({
      name,
      products: [new mongoose.Types.ObjectId(productId)] // Use new ObjectId here
    });
    await category.save();

    res.status(201).send(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).send(error);
  }
});

// Fetch a category by ID and populate its products
app.post('/categories/fetch', async (req, res) => {
  const { id } = req.body; // Get ID from the request body
  try {
    const category = await Category.findById(id).populate('products');
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }
    res.send(category);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/categories/fetch-details', async (req, res) => {
  const { id } = req.body;
  console.log('Received ID:', id);

  try {
    // Find category with population
    const category = await Category.findById(id).populate('products');
    if (!category) {
      console.log('Category not found for ID:', id);
      return res.status(404).send({ message: 'Category not found' });
    }

    // Separate product details (optional)
    const productDetails = category.products.map(product => ({
      name: product.name,
      description: product.description,
      price: product.price,
      img: product.img
    }));

    const response = {
      category: category,
      products: productDetails,
    };

    res.send(response);
  } catch (error) {
    console.error('Error fetching category details:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.get("/addresses/:email", isAuth, async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const userId= user._id;
    const addresses = await Address.find({ userId }).sort({ isDefault: -1 });
    res.status(200).json(addresses);
  } catch (err) {
    res.status(500).json({ error: "Error fetching addresses", details: err.message });
  }
});

app.post("/addresses", async (req, res) => {
  const { email, address1, city, state, pincode, phone, isDefault } = req.body;
  console.log({ email, address1, city, state, pincode, phone, isDefault })
  if (!email || !address1 || !city || !state || !pincode || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const userId= user._id;
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }
    const newAddress = new Address({ userId, address1, city, state, pincode, phone, isDefault });
    await newAddress.save();
    res.status(201).json({ message: "Address added successfully", address: newAddress });
  } catch (err) {
    res.status(500).json({ error: "Error adding address", details: err.message });
  }
});







// app.listen(5000, () => {
//   console.log('Server is running on port 5000');
// });
