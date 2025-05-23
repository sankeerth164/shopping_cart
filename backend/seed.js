const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/shopping_cart')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    description: String
});

const Product = mongoose.model('Product', productSchema);

// Initial Products
const products = [
    {
        name: "LD01 LOUNGE CHAIR",
        price: 2999,
        image: "./images/1.png",
        description: "Elegant and comfortable lounge chair with premium fabric upholstery. Perfect for modern living spaces."
    },
    {
        name: "LD02 LOUNGE CHAIR",
        price: 3499,
        image: "./images/2.png",
        description: "Contemporary design with ergonomic support. Features high-quality leather and solid wood frame."
    },
    {
        name: "LD03 LOUNGE CHAIR",
        price: 4299,
        image: "./images/3.png",
        description: "Minimalist Scandinavian design with plush cushioning. Ideal for reading corners and relaxation."
    },
    {
        name: "LD04 LOUNGE CHAIR",
        price: 2999,
        image: "./images/4.png",
        description: "Classic mid-century modern style with updated comfort features. Durable construction and timeless appeal."
    },
    {
        name: "LD05 LOUNGE CHAIR",
        price: 4999,
        image: "./images/5.png",
        description: "Premium lounge chair with adjustable backrest. Combines style with exceptional comfort."
    },
    {
        name: "LD06 LOUNGE CHAIR",
        price: 3499,
        image: "./images/6.png",
        description: "Modern accent chair with distinctive design. Features premium materials and expert craftsmanship."
    },
    {
        name: "LD07 LOUNGE CHAIR",
        price: 4299,
        image: "./images/7.png",
        description: "Luxurious reclining lounge chair. Perfect blend of comfort and sophisticated design."
    },
    {
        name: "LD08 LOUNGE CHAIR",
        price: 2999,
        image: "./images/8.png",
        description: "Compact yet comfortable lounge chair. Ideal for small spaces without compromising on style."
    }
];

// Seed function
const seedDB = async () => {
    try {
        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Add new products
        await Product.insertMany(products);
        console.log('Added new products');

        // Close connection
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        mongoose.connection.close();
    }
};

// Run seeding
seedDB(); 