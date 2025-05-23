// Format price in Indian Rupees
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price);
}

// Load cart items and update summary
async function loadCartItems() {
    const user = firebase.auth().currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/cart/${user.uid}`);
        if (!response.ok) throw new Error('Failed to fetch cart');
        
        const cartData = await response.json();
        if (!cartData || !cartData.products || cartData.products.length === 0) {
            window.location.href = 'index.html';
            return;
        }

        const cartItemsContainer = document.querySelector('.cart-items');
        let subtotal = 0;

        cartData.products.forEach(item => {
            // Skip if product data is missing or invalid
            if (!item.productId || !item.quantity || !item.productId.price || !item.productId.name) {
                console.error('Invalid product data:', item);
                return;
            }

            try {
                const itemTotal = item.productId.price * item.quantity;
                subtotal += itemTotal;

                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.innerHTML = `
                    <img src="${item.productId.image || 'placeholder.jpg'}" alt="${item.productId.name}">
                    <div class="cart-item-details">
                        <h3>${item.productId.name}</h3>
                        <p>Quantity: ${item.quantity}</p>
                        <p>${formatPrice(itemTotal)}</p>
                    </div>
                `;
                cartItemsContainer.appendChild(itemElement);
            } catch (err) {
                console.error('Error processing cart item:', err);
            }
        });

        // Update summary
        const shipping = 100; // Fixed shipping cost
        const total = subtotal + shipping;

        document.querySelector('.subtotal .amount').textContent = formatPrice(subtotal);
        document.querySelector('.shipping .amount').textContent = formatPrice(shipping);
        document.querySelector('.total .amount').textContent = formatPrice(total);

    } catch (error) {
        console.error('Error loading cart:', error);
        alert('Failed to load cart items. Please try again.');
    }
}

// Handle payment method selection
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const cardFields = document.getElementById('card-payment-fields');
        const upiField = document.getElementById('upi-payment-field');

        switch(e.target.value) {
            case 'card':
                cardFields.style.display = 'block';
                upiField.style.display = 'none';
                break;
            case 'upi':
                cardFields.style.display = 'none';
                upiField.style.display = 'block';
                break;
            case 'cod':
                cardFields.style.display = 'none';
                upiField.style.display = 'none';
                break;
        }
    });
});

// Add these styles at the beginning of the file
const successOverlayStyles = `
.success-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.success-message {
    background: white;
    padding: 40px;
    border-radius: 10px;
    text-align: center;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.5s ease;
}

.success-message h2 {
    color: #4CAF50;
    margin-bottom: 20px;
}

.success-checkmark {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: #4CAF50;
    display: flex;
    align-items: center;
    justify-content: center;
}

.checkmark {
    color: white;
    font-size: 40px;
    transform: scale(0);
    transition: transform 0.5s ease;
}

.show-overlay {
    opacity: 1;
}

.show-message {
    opacity: 1;
    transform: translateY(0);
}

.show-checkmark {
    transform: scale(1);
}`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = successOverlayStyles;
document.head.appendChild(styleSheet);

// Function to show success message
function showSuccessMessage() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'success-message';
    
    // Create checkmark container
    const checkmarkContainer = document.createElement('div');
    checkmarkContainer.className = 'success-checkmark';
    
    // Create checkmark
    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    checkmark.innerHTML = '✓';
    checkmarkContainer.appendChild(checkmark);
    
    // Create message
    const message = document.createElement('h2');
    message.textContent = 'Order Placed Successfully!';
    
    // Assemble the elements
    messageContainer.appendChild(checkmarkContainer);
    messageContainer.appendChild(message);
    overlay.appendChild(messageContainer);
    document.body.appendChild(overlay);
    
    // Trigger animations
    setTimeout(() => {
        overlay.classList.add('show-overlay');
        messageContainer.classList.add('show-message');
        checkmark.classList.add('show-checkmark');
    }, 100);
    
    // Redirect after animation
    setTimeout(() => {
        window.location.href = '/';
    }, 2000);
}

// Handle form submission
document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const formData = {
            shippingAddress: {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value,
                phone: document.getElementById('phone').value
            },
            paymentMethod: paymentMethod
        };

        // Add payment details based on selected method
        if (paymentMethod === 'card') {
            formData.paymentDetails = {
                cardNumber: document.getElementById('cardNumber').value,
                expiry: document.getElementById('expiry').value,
                cvv: document.getElementById('cvv').value
            };
        } else if (paymentMethod === 'upi') {
            formData.paymentDetails = {
                upiId: document.getElementById('upiId').value
            };
        }

        const response = await fetch(`http://localhost:3000/api/orders/${user.uid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showSuccessMessage();
        } else {
            throw new Error('Failed to place order');
        }

    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});

// Input validation
document.getElementById('cardNumber').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 16);
});

document.getElementById('expiry').addEventListener('input', (e) => {
    e.target.value = e.target.value
        .replace(/\D/g, '')
        .substring(0, 4)
        .replace(/(\d{2})(\d)/, '$1/$2');
});

document.getElementById('cvv').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
});

document.getElementById('pincode').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
});

document.getElementById('phone').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
});

// Load cart items when the page loads
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadCartItems();
        } else {
            window.location.href = 'index.html';
        }
    });
}); 