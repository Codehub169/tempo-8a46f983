/**
 * Displays a notification message on the screen.
 * @param {string} message - The message to display.
 * @param {string} type - Type of notification ('info', 'success', 'error', 'warning').
 * @param {number} duration - How long the notification stays visible (in milliseconds).
 */
function showNotification(message, type = 'info', duration = 3000) {
    const notificationArea = document.getElementById('notification-area') || createNotificationArea();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add a close button to notifications for manual dismissal
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;'; // '×' character
    closeButton.style.cssText = 'background:none;border:none;color:inherit;font-size:1.2em;margin-left:15px;cursor:pointer;';
    closeButton.onclick = () => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    };
    notification.appendChild(closeButton);

    notificationArea.prepend(notification); // Prepend to show newest on top

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            // Check if notification still exists before removing (might be manually closed)
            if (notification.parentNode) {
                notification.remove();
            }
        }, 500); // Match CSS fade-out duration
    }, duration);
}

/**
 * Creates the notification area if it doesn't exist.
 * @returns {HTMLElement} The notification area element.
 */
function createNotificationArea() {
    let area = document.getElementById('notification-area');
    if (!area) {
        area = document.createElement('div');
        area.id = 'notification-area';
        // Styles are primarily handled by CSS, but basic positioning can be ensured here if needed.
        // document.body.appendChild(area) is called by the first call to showNotification if area is not found.
        // Ensure it's added to the body for global availability.
        if (document.body) {
            document.body.appendChild(area);
        } else { // Fallback if body is not ready, though scripts are usually deferred
            window.addEventListener('DOMContentLoaded', () => document.body.appendChild(area));
        }
    }
    return area;
}

/**
 * A wrapper for the Fetch API to simplify API calls.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} - A promise that resolves with the JSON response or text response.
 */
async function fetchAPI(url, options = {}) {
    // Default headers for JSON content, can be overridden
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    options.headers = { ...defaultHeaders, ...options.headers };

    // Stringify body if it's an object and method is not GET/HEAD
    if (options.body && typeof options.body === 'object' && !['GET', 'HEAD'].includes(options.method?.toUpperCase())) {
        options.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            let errorMessage = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // If response is not JSON, try to get text
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type');
        if (response.status === 204) { // No Content
            return null;
        }
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (error) {
        console.error('API Fetch Error:', error.message);
        showNotification(`API Error: ${error.message}`, 'error');
        throw error; // Re-throw to allow caller to handle specifically if needed
    }
}

/**
 * Formats a number as currency.
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency code (e.g., 'USD').
 * @returns {string} - The formatted currency string.
 */
function formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number') {
        return String(amount); // Return as string if not a number
    }
    return amount.toLocaleString('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats a date string into a more readable format.
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} - The formatted date string (e.g., 'Jan 1, 2023').
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC' // Assuming dates from DB are UTC
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString; // Return original if formatting fails
    }
}

/**
 * Helper to show a loading spinner or indicator.
 * Assumes a spinner element with ID 'loading-spinner' exists in HTML.
 * @param {boolean} show - True to show, false to hide.
 */
function toggleLoadingSpinner(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}
