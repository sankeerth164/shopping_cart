// DOM Elements
const authOverlay = document.getElementById('authOverlay');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerContainer = document.querySelector('.register-container');
const loginContainer = document.querySelector('.login-container');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileIcon = document.getElementById('profileIcon');
const iconWrapper = document.querySelector('.icon-wrapper');
const email = document.getElementById('email');
const password = document.getElementById('password');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const adminLink = document.getElementById('adminLink');

// Show login form when clicking profile icon
profileIcon.addEventListener('click', () => {
    if (!firebase.auth().currentUser) {
        showLoginForm();
    }
});

// Show register form
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerContainer.style.display = 'block';
    loginContainer.style.display = 'none';
});

// Show login form
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerContainer.style.display = 'none';
    loginContainer.style.display = 'block';
});

// Close auth overlay when clicking outside
authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) {
        hideLoginForm();
    }
});

// Google Sign In
googleLoginBtn.addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Configure Google Sign-In with basic scopes
        provider.addScope('email');
        provider.addScope('profile');

        // Force account selection even if a user is already signed in
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        // Use signInWithPopup to show the account selector
        const result = await firebase.auth().signInWithPopup(provider);
        console.log('Google sign in successful:', result.user);
        hideLoginForm();
    } catch (error) {
        console.error('Google sign in error:', error);
        if (error.code === 'auth/popup-blocked') {
            alert('Please allow popups for this website to sign in with Google.');
        } else {
            alert('Failed to sign in with Google. Please try again.');
        }
    }
});

// Email/Password Login
loginBtn.addEventListener('click', async () => {
    try {
        const result = await firebase.auth().signInWithEmailAndPassword(
            email.value,
            password.value
        );
        console.log('Email sign in successful:', result.user);
        hideLoginForm();
    } catch (error) {
        console.error('Email sign in error:', error);
        alert('Failed to sign in. Please check your credentials.');
    }
});

// Register
registerBtn.addEventListener('click', async () => {
    try {
        const result = await firebase.auth().createUserWithEmailAndPassword(
            regEmail.value,
            regPassword.value
        );
        console.log('Registration successful:', result.user);
        hideLoginForm();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Failed to register. ' + error.message);
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await firebase.auth().signOut();
        // Reset cart and show login form
        if (typeof cart !== 'undefined') {
            cart = [];
            addCartToHTML();
        }
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out.');
    }
});

// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    
    if (user) {
        // User is signed in
        console.log('User info:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        });
        
        hideLoginForm();
        logoutBtn.style.display = 'block';
        adminLink.style.display = 'block';
        
        // Update profile icon
        const iconImg = profileIcon.querySelector('img');
        if (user.photoURL) {
            iconImg.src = user.photoURL;
        } else {
            // Default avatar
            iconImg.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        }
        
        // Fetch user's cart
        fetchUserCart(user.uid);
    } else {
        // User is signed out
        logoutBtn.style.display = 'none';
        adminLink.style.display = 'none';
        profileIcon.querySelector('img').src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        
        // Reset cart
        if (typeof cart !== 'undefined') {
            cart = [];
            addCartToHTML();
        }
    }
});

// Helper functions
function hideLoginForm() {
    authOverlay.style.display = 'none';
    loginFormContainer.style.display = 'none';
}

function showLoginForm() {
    authOverlay.style.display = 'block';
    loginFormContainer.style.display = 'block';
    registerContainer.style.display = 'none';
    loginContainer.style.display = 'block';
}

// Fetch user's cart
async function fetchUserCart(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/cart/${userId}`);
        if (response.ok) {
            const cartData = await response.json();
            if (cartData && cartData.products) {
                cart = cartData.products;
                addCartToHTML();
            }
        }
    } catch (error) {
        console.error('Error fetching user cart:', error);
    }
} 