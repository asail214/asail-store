// Asail Store - Main JavaScript File
// API Integration with FakeShopAPI

// Global Variables
let allProducts = [];
let cart = [];
let categories = [];

// API Base URL (using FakeStore API as mentioned in SRS)
const API_BASE_URL = 'https://fakestoreapi.com';

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const categoryFilter = document.getElementById('categoryFilter');
const sortPrice = document.getElementById('sortPrice');
const cartCount = document.getElementById('cartCount');

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Asail Store is starting...');
    initializeApp();
});

// Main initialization function
async function initializeApp() {
    try {
        showLoading(true);
        
        // Load cart from localStorage
        cart = JSON.parse(localStorage.getItem('asail_cart') || '[]');
        updateCartCount();
        
        // Fetch data
        await Promise.all([
            fetchCategories(),
            fetchProducts()
        ]);
        
        setupEventListeners();
        
        // Add minimum display time for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showError('Failed to load products. Please refresh the page.');
    } finally {
        showLoading(false);
    }
}

// Fetch all products from API
async function fetchProducts() {
    try {
        console.log('📦 Fetching products...');
        
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allProducts = await response.json();
        console.log(`✅ Loaded ${allProducts.length} products`);
        
        displayProducts(allProducts);
        
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        throw error;
    }
}

// Fetch all categories from API
async function fetchCategories() {
    try {
        console.log('📋 Fetching categories...');
        
        const response = await fetch(`${API_BASE_URL}/products/categories`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        categories = await response.json();
        console.log(`✅ Loaded ${categories.length} categories`);
        
        populateCategoryFilter();
        
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        throw error;
    }
}

// Display products in the container
function displayProducts(products) {
    if (!products || products.length === 0) {
        productsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0;">
                <h3 class="text-muted">No products found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    productsContainer.innerHTML = products.map((product, index) => `
        <div class="card product-card animate" style="animation-delay: ${index * 0.1}s">
            <img src="${product.image}" 
                 class="card-img-top product-image" 
                 alt="${product.title}"
                 onerror="this.src='https://via.placeholder.com/300x250?text=No+Image'">
            
            <div class="card-body">
                <span class="badge product-category mb-2">${product.category}</span>
                
                <h5 class="card-title product-title">${product.title}</h5>
                
                <p class="card-text product-description">
                    ${product.description.substring(0, 100)}...
                </p>
                
                <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="product-price">${product.price}</span>
                        <div class="text-warning">
                            ${generateStars(product.rating.rate)}
                            <small class="text-muted">(${product.rating.count})</small>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary w-100" 
                            onclick="addToCart(${product.id})">
                        🛒 Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    console.log(`✅ Displayed ${products.length} products`);
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + 
           (halfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const categoryOptions = categories.map(category => 
        `<option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>`
    ).join('');
    
    categoryFilter.innerHTML = `
        <option value="">All Categories</option>
        ${categoryOptions}
    `;
    
    // Also populate navbar dropdown
    populateNavbarCategories();
}

// Populate navbar categories dropdown
function populateNavbarCategories() {
    const navCategories = document.getElementById('navCategories');
    if (navCategories) {
        const categoryItems = categories.map(category => 
            `<li><a class="dropdown-item" href="#" onclick="filterByCategory('${category}')">${category.charAt(0).toUpperCase() + category.slice(1)}</a></li>`
        ).join('');
        
        navCategories.innerHTML = `
            <li><a class="dropdown-item" href="#" onclick="filterByCategory('')">All Categories</a></li>
            <li><hr class="dropdown-divider"></li>
            ${categoryItems}
        `;
    }
}

// Filter by category from navbar
function filterByCategory(category) {
    categoryFilter.value = category;
    filterAndSortProducts();
    
    // Close dropdown on mobile
    const dropdown = document.getElementById('categoriesDropdown');
    if (dropdown) {
        bootstrap.Dropdown.getInstance(dropdown)?.hide();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Category filter change
    categoryFilter.addEventListener('change', filterAndSortProducts);
    
    // Price sort change
    sortPrice.addEventListener('change', filterAndSortProducts);
    
    console.log('✅ Event listeners setup complete');
}

// Filter and sort products based on user selection
function filterAndSortProducts() {
    let filteredProducts = [...allProducts];
    
    // Apply category filter
    const selectedCategory = categoryFilter.value;
    if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
            product.category === selectedCategory
        );
    }
    
    // Apply price sorting
    const sortOption = sortPrice.value;
    if (sortOption === 'low-high') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'high-low') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
    
    console.log(`🔍 Filtered to ${filteredProducts.length} products`);
    displayProducts(filteredProducts);
}

// Add product to cart
async function addToCart(productId) {
    try {
        console.log(`🛒 Adding product ${productId} to cart`);
        
        // Find the product
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            throw new Error('Product not found');
        }
        
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('asail_cart', JSON.stringify(cart));
        
        updateCartCount();
        showNotification(`✅ ${product.title} added to cart!`, 'success');
        
        // Optional: Send to API (as per SRS requirements)
        // await sendCartToAPI();
        
    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        showNotification('❌ Failed to add product to cart', 'error');
    }
}

// Update cart count in navigation with animation
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Add pulse animation when cart is not empty
    const cartPulse = document.querySelector('.cart-pulse');
    if (totalItems > 0) {
        cartPulse?.classList.remove('d-none');
    } else {
        cartPulse?.classList.add('d-none');
    }
    
    // Animate cart badge
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.style.animation = 'none';
        cartBadge.offsetHeight; // Trigger reflow
        cartBadge.style.animation = 'bounce 0.6s ease';
    }
}

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('bg-dark');
    
    if (isDark) {
        // Switch to light theme
        body.classList.remove('bg-dark', 'text-light');
        body.classList.add('bg-light', 'text-dark');
        showNotification('🌞 Switched to Light Theme', 'success');
    } else {
        // Switch to dark theme
        body.classList.remove('bg-light', 'text-dark');
        body.classList.add('bg-dark', 'text-light');
        showNotification('🌙 Switched to Dark Theme', 'success');
    }
}

// Smooth scroll for navbar links
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Show/hide loading spinner
function showLoading(show) {
    const body = document.body;
    
    if (show) {
        body.classList.remove('loading-complete');
        body.classList.add('loading-active');
    } else {
        body.classList.remove('loading-active');
        body.classList.add('loading-complete');
    }
}

// Show notification messages
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    notification.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>${message}</span>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Show error message
function showError(message) {
    productsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0;">
            <div class="alert alert-danger">
                <h4>⚠️ Error</h4>
                <p>${message}</p>
                <button class="btn btn-outline-danger" onclick="location.reload()">
                    🔄 Try Again
                </button>
            </div>
        </div>
    `;
    showLoading(false);
}

// Optional: Send cart data to API (as mentioned in SRS)
async function sendCartToAPI() {
    try {
        const cartData = {
            userId: 1, // Mock user ID
            date: new Date().toISOString().split('T')[0],
            products: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }))
        };
        
        const response = await fetch(`${API_BASE_URL}/carts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartData)
        });
        
        if (response.ok) {
            console.log('✅ Cart sent to API successfully');
        }
        
    } catch (error) {
        console.error('❌ Error sending cart to API:', error);
    }
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('📱 Asail Store JavaScript loaded successfully!');