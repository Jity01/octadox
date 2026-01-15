// ================================
// Octadox Landing Page JavaScript
// Stripe Payment Integration
// ================================

// Configuration - Replace with your actual values
const CONFIG = {
    // Replace with your Stripe publishable key
    stripePublishableKey: 'pk_live_51SpiimCHpaq6nenDHaQl3O8A2YtwVllX3onLQ5XrxbrulSTFtdjroNjxrazWtn2T6bGD5ui5fs7d3FzpFXHrpZmY00yiNuVvHc',
    // Replace with your backend URL
    backendUrl: '/api',
    // Contact info shown after successful payment
    contactEmail: 'founders@octadox.com',
    contactPhone: '(617) 804-5463'
};

// Initialize Stripe
let stripe;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe with your publishable key
    if (CONFIG.stripePublishableKey && CONFIG.stripePublishableKey !== 'pk_test_YOUR_PUBLISHABLE_KEY_HERE') {
        stripe = Stripe(CONFIG.stripePublishableKey);
    }

    // Initialize all components
    initNavigation();
    initSmoothScroll();
    initCheckoutButton();
    initUrlParams();
});

// Navigation functionality
function initNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    // Add scroll effect to navbar
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Checkout button functionality
function initCheckoutButton() {
    const checkoutButton = document.getElementById('checkout-button');

    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }
}

// Handle checkout process
async function handleCheckout() {
    const checkoutButton = document.getElementById('checkout-button');

    // Add loading state
    checkoutButton.classList.add('loading');
    checkoutButton.disabled = true;

    try {
        // Check if Stripe is initialized
        if (!stripe) {
            // For demo purposes, show the success modal with instructions
            showDemoMode();
            return;
        }

        // Create checkout session on your backend
        const response = await fetch(`${CONFIG.backendUrl}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: 'price_octadox_client', // Your Stripe Price ID
                successUrl: `${window.location.origin}?payment=success`,
                cancelUrl: `${window.location.origin}?payment=cancelled`
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const session = await response.json();

        if (!session.id) {
            throw new Error(session.error || 'Failed to create checkout session');
        }

        console.log('Redirecting to checkout session:', session.id);

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });

        if (result.error) {
            console.error('Stripe redirect error:', result.error);
            // Provide more helpful error message
            if (result.error.message && result.error.message.includes('Checkout Session could not be found')) {
                throw new Error('API key mismatch: Your publishable key and secret key must be from the same Stripe account and both in test mode (or both in live mode). Please check your .env.local file.');
            }
            throw new Error(result.error.message);
        }

    } catch (error) {
        console.error('Checkout error:', error);
        // Show more specific error message
        let errorMessage = 'Something went wrong. Please try again or contact us directly.';
        if (error.message && error.message.includes('API key mismatch')) {
            errorMessage = error.message;
        } else if (error.message && error.message.includes('Checkout Session')) {
            errorMessage = 'Payment session error. Please ensure your Stripe keys are correctly configured and from the same account.';
        }
        showError(errorMessage);
    } finally {
        checkoutButton.classList.remove('loading');
        checkoutButton.disabled = false;
    }
}

// Show demo mode message (when Stripe isn't configured)
function showDemoMode() {
    const checkoutButton = document.getElementById('checkout-button');
    checkoutButton.classList.remove('loading');
    checkoutButton.disabled = false;

    // For demo, show the success modal
    const modal = document.getElementById('success-modal');
    const emailEl = document.getElementById('contact-email');
    const phoneEl = document.getElementById('contact-phone');

    if (emailEl) emailEl.textContent = CONFIG.contactEmail;
    if (phoneEl) phoneEl.textContent = CONFIG.contactPhone;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Log setup instructions
    console.log('%c Octadox Stripe Setup Instructions ', 'background: #1E3A5F; color: white; padding: 10px; font-size: 14px;');
    console.log(`
To enable real payments:

1. Get your Stripe keys from https://dashboard.stripe.com/apikeys

2. Update CONFIG in app.js:
   stripePublishableKey: 'pk_live_YOUR_KEY' or 'pk_test_YOUR_KEY'

3. Create a product and price in Stripe Dashboard

4. Set up the server (see server/ directory) with your Secret Key

5. Deploy the backend and update CONFIG.backendUrl
    `);
}

// Check URL parameters for payment status
function initUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
        showSuccessModal();
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
        showMessage('Payment was cancelled. Feel free to try again when you\'re ready.');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    const emailEl = document.getElementById('contact-email');
    const phoneEl = document.getElementById('contact-phone');

    if (emailEl) emailEl.textContent = CONFIG.contactEmail;
    if (phoneEl) phoneEl.textContent = CONFIG.contactPhone;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('success-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Show error message
function showError(message) {
    // Create toast notification
    showToast(message, 'error');
}

// Show success message
function showMessage(message) {
    showToast(message, 'info');
}

// Toast notification system
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `;

    // Add toast styles if not already present
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 3000;
                animation: toastSlideIn 0.3s ease;
            }

            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                background-color: #1F2937;
                color: white;
                border-radius: 8px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }

            .toast-error .toast-content {
                background-color: #EF4444;
            }

            .toast-success .toast-content {
                background-color: #10B981;
            }

            .toast-message {
                font-size: 14px;
                font-weight: 500;
            }

            .toast-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .toast-close svg {
                width: 16px;
                height: 16px;
                color: white;
                opacity: 0.7;
            }

            .toast-close:hover svg {
                opacity: 1;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Add mobile menu styles dynamically
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    @media (max-width: 768px) {
        .nav-links.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 72px;
            left: 0;
            right: 0;
            background-color: white;
            padding: 24px;
            gap: 16px;
            border-bottom: 1px solid #E5E7EB;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .mobile-menu-btn.active span:first-child {
            transform: rotate(45deg) translate(5px, 5px);
        }

        .mobile-menu-btn.active span:nth-child(2) {
            opacity: 0;
        }

        .mobile-menu-btn.active span:last-child {
            transform: rotate(-45deg) translate(5px, -5px);
        }
    }

    .navbar.scrolled {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(mobileStyles);

// Expose closeModal to global scope for onclick handler
window.closeModal = closeModal;
