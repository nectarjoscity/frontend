// Landing page configuration

/**
 * Get the landing page setting
 * @returns {string} 'main' - The main ordering page
 */
export function getLandingPage() {
  return 'main';
}

/**
 * Set the landing page
 * @param {string} page - The landing page setting
 */
export function setLandingPage(page) {
  console.log('Landing page setting:', page);
}

/**
 * Check if preorder should be the landing page
 * @returns {boolean} false - Preorder period is over
 */
export function isPreOrderLandingPage() {
  return false;
}
