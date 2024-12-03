const mongoose = require('mongoose');

const Category = require('./models/Category'); 
const Product = require('./models/Products');

const { category_list, food_list } = require('./data'); 


const mongoURI = "mongodb+srv://admin:admin@cluster0.jpkgl.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"; 

const initializeDatabase = async () => {
  try {
    
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log("Cleared existing data");

    
    const categories = await Category.insertMany(
      category_list.map(category => ({ name: category.category_name }))
    );
    console.log("Inserted categories");

    
    const categoryMap = categories.reduce((map, category) => {
      map[category.name] = category._id;
      return map;
    }, {});

   
    const products = await Product.insertMany(
      food_list.map(food => ({
        name: food.name,
        description: food.description,
        price: food.price,
        image: food.image,
        category: categoryMap[food.category],
      }))
    );
    console.log("Inserted products");

   
    for (const product of products) {
      await Category.updateOne(
        { _id: product.category },
        { $push: { products: product._id } }
      );
    }
    console.log("Linked products to categories");

   
    mongoose.connection.close();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing the database:", error);
    mongoose.connection.close();
  }
};

initializeDatabase();
