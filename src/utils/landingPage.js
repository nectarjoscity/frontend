// Landing page configuration - hardcoded to preorder

/**
 * Get the landing page (always preorder)
 * @returns {string} 'preorder'
 */
export function getLandingPage() {
  return 'preorder';
}

/**
 * Set the landing page (no-op since it's hardcoded)
 * @param {string} page - The landing page setting
 */
export function setLandingPage(page) {
  // Currently hardcoded to preorder, this is a no-op
  // Could be extended to store in localStorage if needed
  console.log('Landing page setting:', page);
}

/**
 * Check if preorder should be the landing page (always true)
 * @returns {boolean}
 */
export function isPreOrderLandingPage() {
  return true;
}
