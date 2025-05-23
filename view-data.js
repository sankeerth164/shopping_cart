const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/shopping_cart')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String
});

// Cart Schema
const cartSchema = new mongoose.Schema({
    userId: String,
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number
    }]
});

const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);

async function viewData() {
    try {
        // View all products
        console.log('\n=== Products ===');
        const products = await Product.find();
        console.log(JSON.stringify(products, null, 2));

        // View all carts
        console.log('\n=== Carts ===');
        const carts = await Cart.find().populate('products.productId');
        console.log(JSON.stringify(carts, null, 2));

        mongoose.connection.close();
    } catch (error) {
        console.error('Error viewing data:', error);
        mongoose.connection.close();
    }
}

viewData(); 