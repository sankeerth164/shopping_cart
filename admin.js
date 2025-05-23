document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Load products
        loadProducts();
        
        // Setup logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            firebase.auth().signOut()
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(error => showNotification('Error logging out: ' + error.message, 'error'));
        });
    });
    
    // Setup form submission
    document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
});

// Format price in Indian Rupees
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price);
}

// Load products from database
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products: ' + error.message, 'error');
    }
}

// Display products in the list
function displayProducts(products) {
    const productListElement = document.getElementById('productList');
    productListElement.innerHTML = '';
    
    if (!products || products.length === 0) {
        productListElement.innerHTML = '<div class="no-products">No products found</div>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img class="product-img" src="${product.image}" alt="${product.name}" onerror="this.src='./images/placeholder.png'">
            <div class="product-details">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-description">${product.description || 'No description available'}</div>
            </div>
            <div class="product-actions">
                <button class="edit-btn" data-id="${product._id}">Edit</button>
                <button class="delete-btn" data-id="${product._id}">Delete</button>
            </div>
        `;
        
        productListElement.appendChild(productCard);
        
        // Add event listeners for edit and delete buttons
        productCard.querySelector('.edit-btn').addEventListener('click', () => editProduct(product));
        productCard.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(product._id));
    });
}

// Handle adding a new product
async function handleAddProduct(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Adding...';
    submitButton.disabled = true;
    
    try {
        const name = document.getElementById('productName').value;
        const price = parseInt(document.getElementById('productPrice').value);
        const image = document.getElementById('productImage').value;
        const description = document.getElementById('productDescription').value;
        
        if (!name || !price || !image) {
            throw new Error('Please fill all required fields');
        }
        
        const productData = {
            name,
            price,
            image,
            description
        };
        
        const response = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add product');
        }
        
        // Reset form
        document.getElementById('addProductForm').reset();
        
        // Reload products
        loadProducts();
        
        // Show success notification
        showNotification('Product added successfully', 'success');
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('Error adding product: ' + error.message, 'error');
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

// Edit product
function editProduct(product) {
    // Populate form with product details
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productDescription').value = product.description || '';
    
    // Change form submission behavior
    const form = document.getElementById('addProductForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Update button text
    submitButton.textContent = 'Update Product';
    
    // Remove existing event listener and add new one
    form.removeEventListener('submit', handleAddProduct);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        submitButton.textContent = 'Updating...';
        submitButton.disabled = true;
        
        try {
            const updatedProduct = {
                name: document.getElementById('productName').value,
                price: parseInt(document.getElementById('productPrice').value),
                image: document.getElementById('productImage').value,
                description: document.getElementById('productDescription').value
            };
            
            const response = await fetch(`http://localhost:3000/api/products/${product._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProduct)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update product');
            }
            
            // Reset form and event listeners
            form.reset();
            form.removeEventListener('submit', arguments.callee);
            form.addEventListener('submit', handleAddProduct);
            submitButton.textContent = 'Add Product';
            
            // Reload products
            loadProducts();
            
            // Show success notification
            showNotification('Product updated successfully', 'success');
        } catch (error) {
            console.error('Error updating product:', error);
            showNotification('Error updating product: ' + error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    });
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete product');
        }
        
        // Reload products
        loadProducts();
        
        // Show success notification
        showNotification('Product deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product: ' + error.message, 'error');
    }
}

// Show notification
function showNotification(message, type) {
    const notificationContainer = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
} 