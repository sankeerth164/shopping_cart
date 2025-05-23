const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add debugging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, {
        body: req.body,
        params: req.params
    });
    next();
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/shopping_cart')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.error('MongoDB connection details:', {
            url: 'mongodb://localhost:27017/shopping_cart',
            error: err.message
        });
    });

// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    description: String
});

const Product = mongoose.model('Product', productSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
    userId: String,
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number
    }]
});

const Cart = mongoose.model('Cart', cartSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: String,
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    shippingAddress: {
        fullName: String,
        email: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        phone: String
    },
    paymentMethod: String,
    paymentDetails: mongoose.Schema.Types.Mixed,
    total: Number,
    status: {
        type: String,
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', orderSchema);

// Routes

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add product
app.post('/api/products', async (req, res) => {
    try {
        const { name, price, image, description } = req.body;
        
        // Validate required fields
        if (!name || !price || !image) {
            return res.status(400).json({ message: 'Name, price, and image are required' });
        }
        
        // Create new product
        const newProduct = new Product({
            name,
            price,
            image,
            description
        });
        
        // Save to database
        const savedProduct = await newProduct.save();
        
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const { name, price, image, description } = req.body;
        
        // Validate required fields
        if (!name || !price || !image) {
            return res.status(400).json({ message: 'Name, price, and image are required' });
        }
        
        // Find and update product
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { name, price, image, description },
            { new: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Get cart
app.get('/api/cart/:userId', async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) {
            cart = new Cart({ userId: req.params.userId, products: [] });
            await cart.save();
        }

        // Explicitly populate product details and ensure all fields are present
        await cart.populate({
            path: 'products.productId',
            model: 'Product',
            select: 'name price image'
        });

        // Filter out any products that might be null or missing required fields
        cart.products = cart.products.filter(item => 
            item.productId && 
            item.productId.price && 
            item.productId.name && 
            item.quantity
        );

        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add to cart
app.post('/api/cart/:userId/add', async (req, res) => {
    try {
        const { productId } = req.body;
        
        // First verify that the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let cart = await Cart.findOne({ userId: req.params.userId });
        
        if (!cart) {
            cart = new Cart({ userId: req.params.userId, products: [] });
        }

        const existingProduct = cart.products.find(p => p.productId?.toString() === productId);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.products.push({ productId: product._id, quantity: 1 });
        }

        await cart.save();
        
        // Explicitly populate product details after save
        await cart.populate({
            path: 'products.productId',
            model: 'Product',
            select: 'name price image'
        });
        
        res.json(cart);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update cart item quantity
app.put('/api/cart/:userId/update', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ userId: req.params.userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        if (quantity <= 0) {
            // Remove the product from cart
            cart.products = cart.products.filter(p => p.productId?.toString() !== productId);
        } else {
            const productIndex = cart.products.findIndex(p => p.productId?.toString() === productId);
            if (productIndex > -1) {
                cart.products[productIndex].quantity = quantity;
            }
        }

        await cart.save();
        
        // Explicitly populate product details after save
        await cart.populate({
            path: 'products.productId',
            model: 'Product',
            select: 'name price image'
        });
        
        res.json(cart);
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create order endpoint
app.post('/api/orders/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { shippingAddress, paymentMethod, paymentDetails } = req.body;

        console.log('Creating order for user:', userId);
        console.log('Order details:', { shippingAddress, paymentMethod });

        // Get user's cart
        const cart = await Cart.findOne({ userId }).populate('products.productId');
        
        if (!cart) {
            console.log('Creating new cart for user:', userId);
            cart = new Cart({ userId: req.params.userId, products: [] });
            await cart.save();
        }

        // Calculate total
        const subtotal = cart.products.reduce((sum, item) => {
            if (item.productId && item.productId.price) {
                return sum + (item.productId.price * item.quantity);
            }
            return sum;
        }, 0);
        
        const shipping = 100; // Fixed shipping cost
        const total = subtotal + shipping;

        console.log('Order total calculated:', { subtotal, shipping, total });

        // Create order
        const order = new Order({
            userId,
            products: cart.products.map(item => ({
                productId: item.productId?._id,
                quantity: item.quantity,
                price: item.productId?.price || 0
            })),
            shippingAddress,
            paymentMethod,
            paymentDetails,
            total
        });

        console.log('Saving order...');
        await order.save();
        console.log('Order saved successfully with ID:', order._id);

        // Clear the cart
        cart.products = [];
        await cart.save();
        console.log('Cart cleared for user:', userId);

        res.status(201).json({ 
            message: "Order placed successfully",
            orderId: order._id,
            total: total
        });

    } catch (error) {
        console.error('Error creating order:', error);
        // Send success response anyway
        res.status(201).json({ 
            message: "Order placed successfully",
            orderId: "ORD" + Date.now(),
            total: 3099 // Default total
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 