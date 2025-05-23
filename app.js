// DOM Elements
const listProduct = document.querySelector('.listProduct');
const listCart = document.querySelector('.listCart');
const iconCart = document.querySelector('.icon-cart');
const iconCartSpan = document.querySelector('.icon-cart span');
const body = document.querySelector('body');
const closeCart = document.querySelector('.close');
const checkOut = document.querySelector('.checkOut');

// Cart state
let cart = [];
let products = [];

// Reset cart display
function resetCart() {
    cart = [];
    listCart.innerHTML = '';
    iconCartSpan.innerHTML = '0';
    body.classList.remove('showCart');
}

// Format price in Indian Rupees
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price);
}

// Fetch products from backend
async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        products = await response.json();
        addProductToHTML();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Add products to HTML
function addProductToHTML() {
    listProduct.innerHTML = '';
    if (products.length > 0) {
        products.forEach(product => {
            const newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h2>${product.name}</h2>
                <p class="description">${product.description}</p>
                <div class="price">${formatPrice(product.price)}</div>
                <button onclick="addCart('${product._id}')">Add To Cart</button>
            `;
            listProduct.appendChild(newProduct);
        });
    }
}

// Update cart count
function updateCartCount() {
    if (!cart || !Array.isArray(cart)) {
        iconCartSpan.innerHTML = '0';
        return;
    }
    
    const totalQuantity = cart.reduce((total, item) => {
        if (item && 
            item.productId && 
            typeof item.productId === 'object' &&
            typeof item.quantity === 'number' &&
            item.quantity > 0) {
            return total + item.quantity;
        }
        return total;
    }, 0);
    
    iconCartSpan.innerHTML = totalQuantity.toString();
}

// Add cart to HTML
function addCartToHTML() {
    listCart.innerHTML = '';
    let totalPrice = 0;

    if (cart && Array.isArray(cart) && cart.length > 0) {
        cart.forEach(item => {
            if (!item || !item.productId || typeof item.productId !== 'object') {
                return;
            }

            const quantity = parseInt(item.quantity) || 0;
            if (quantity <= 0) return;

            const price = parseFloat(item.productId.price) || 0;
            const itemTotal = price * quantity;

            if (isNaN(itemTotal)) {
                return;
            }

            totalPrice += itemTotal;

            const newItem = document.createElement('div');
            newItem.classList.add('item');
            newItem.innerHTML = `
                <img src="${item.productId.image || ''}" alt="${item.productId.name || 'Product'}">
                <div class="name">${item.productId.name || 'Unknown Product'}</div>
                <div class="quantity">
                    <span class="minus" onclick="changeQuantity('${item.productId._id}', ${quantity - 1})">-</span>
                    <span>${quantity}</span>
                    <span class="plus" onclick="changeQuantity('${item.productId._id}', ${quantity + 1})">+</span>
                </div>
                <div class="price">${formatPrice(itemTotal)}</div>
            `;
            listCart.appendChild(newItem);
        });

        if (totalPrice > 0) {
            const totalDiv = document.createElement('div');
            totalDiv.classList.add('total');
            totalDiv.innerHTML = `
                <div class="total-label">Total:</div>
                <div class="total-price">${formatPrice(totalPrice)}</div>
            `;
            listCart.appendChild(totalDiv);
        }
    } else {
        listCart.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    }
    
    updateCartCount();
}

// Add to cart
window.addCart = async function(productId) {
    if (!firebase.apps.length) {
        console.error('Firebase not initialized');
        alert('Please wait while we initialize the system...');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user || !user.uid) {
        alert('Please login to add items to cart');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/cart/${user.uid}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to add to cart');
        }

        if (!data || !data.products) {
            throw new Error('Invalid cart data received from server');
        }

        cart = data.products;
        addCartToHTML();
        body.classList.add('showCart');
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

// Change quantity
window.changeQuantity = async function(productId, newQuantity) {
    if (newQuantity < 0) return;
    
    const userId = firebase.auth().currentUser?.uid;
    if (!userId) return;

    try {
        const response = await fetch(`http://localhost:3000/api/cart/${userId}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity: newQuantity })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update cart');
        }

        const updatedCart = await response.json();
        cart = updatedCart.products;
        addCartToHTML();
    } catch (error) {
        console.error('Error updating cart:', error);
        alert('Failed to update cart. Please try again.');
    }
}

// Event Listeners
iconCart.addEventListener('click', () => {
    body.classList.add('showCart');
});

closeCart.addEventListener('click', () => {
    body.classList.remove('showCart');
});

checkOut.addEventListener('click', () => {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please login to checkout');
        return;
    }

    if (!cart || !Array.isArray(cart)) {
        alert('Your cart is empty!');
        return;
    }

    const validItems = cart.filter(item => 
        item && 
        item.productId && 
        typeof item.productId === 'object' &&
        item.quantity > 0
    );

    if (validItems.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    console.log('Redirecting to checkout...');
    window.location.href = 'checkout.html';
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return;
    }

    resetCart();
    fetchProducts();

    firebase.auth().onAuthStateChanged(async (user) => {
        resetCart();
        
        if (user) {
            try {
                const response = await fetch(`http://localhost:3000/api/cart/${user.uid}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch cart');
                }

                const cartData = await response.json();
                if (cartData && Array.isArray(cartData.products)) {
                    cart = cartData.products.filter(item => 
                        item && 
                        item.productId && 
                        typeof item.productId === 'object' &&
                        item.productId._id &&
                        typeof item.quantity === 'number' &&
                        item.quantity > 0
                    );
                    
                    if (cart.length > 0) {
                        addCartToHTML();
                    }
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
                resetCart();
            }
        }
    });
}); 