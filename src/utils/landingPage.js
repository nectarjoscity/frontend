// Landing page configuration - hardcoded to preorder

/**
 * Get the landing page (always preorder)
 * @returns {string} 'preorder'
 */
export function getLandingPage() {
  return 'preorder';
}

/**
 * Check if preorder should be the landing page (always true)
 * @returns {boolean}
 */
export function isPreOrderLandingPage() {
  return true;
}
