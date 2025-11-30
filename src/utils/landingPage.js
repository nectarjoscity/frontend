// Landing page configuration utilities

const LANDING_PAGE_KEY = 'nectarv_landing_page';

/**
 * Get the current landing page setting
 * @returns {string} 'main' or 'preorder'
 */
export function getLandingPage() {
  if (typeof window === 'undefined') return 'main'; // Default for SSR
  
  try {
    const stored = localStorage.getItem(LANDING_PAGE_KEY);
    return stored === 'preorder' ? 'preorder' : 'main';
  } catch (error) {
    console.error('Error getting landing page:', error);
    return 'main';
  }
}

/**
 * Set the landing page preference
 * @param {string} page - 'main' or 'preorder'
 */
export function setLandingPage(page) {
  if (typeof window === 'undefined') return;
  
  try {
    if (page === 'preorder' || page === 'main') {
      localStorage.setItem(LANDING_PAGE_KEY, page);
    } else {
      console.error('Invalid landing page value:', page);
    }
  } catch (error) {
    console.error('Error setting landing page:', error);
  }
}

/**
 * Check if preorder should be the landing page
 * @returns {boolean}
 */
export function isPreOrderLandingPage() {
  return getLandingPage() === 'preorder';
}

