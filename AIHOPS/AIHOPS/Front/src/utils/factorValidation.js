/**
 * Utility functions for factor validation
 */

/**
 * Validates that a factor has all required fields
 * - Name is required
 * - Description is required
 * - All scale descriptions (0-4) are required
 * - Explanations are completely optional
 * 
 * @param {Object} factor - The factor to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateFactor = (factor) => {
    const errors = [];
  
    // Check name
    if (!factor.name || factor.name.trim() === '') {
      errors.push('Factor name is required');
    }
  
    // Check description
    if (!factor.description || factor.description.trim() === '') {
      errors.push('Factor description is required');
    }
  
    // Check scale descriptions
    if (!factor.scales_desc) {
      errors.push('Scale descriptions are required');
    } else {
      // Check that all 5 scale descriptions exist and are not empty
      for (let i = 0; i <= 4; i++) {
        if (!factor.scales_desc[i] || factor.scales_desc[i].trim() === '') {
          errors.push(`Description for scale value ${i} is required`);
        }
      }
    }
  
    // Explanations are completely optional - no validation needed
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Checks if a factor has any explanations
   * 
   * @param {Object} factor - The factor to check
   * @returns {boolean} - True if the factor has at least one non-empty explanation
   */
  export const hasExplanations = (factor) => {
    if (!factor || !factor.scales_explanation) return false;
    
    return Object.values(factor.scales_explanation).some(exp => exp && exp.trim() !== '');
  };