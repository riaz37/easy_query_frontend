import { useState, useCallback } from 'react';
import { BusinessRulesValidator, BusinessRuleValidation } from '@/lib/utils/business-rules-validator';

/**
 * Hook for validating database queries against business rules
 */
export function useDatabaseQueryValidation(businessRules?: string) {
  const [validationResult, setValidationResult] = useState<BusinessRuleValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Validate a database query against business rules
   */
  const validateQueryAgainstRules = useCallback(async (
    query: string
  ): Promise<BusinessRuleValidation> => {
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      // Validate query using BusinessRulesValidator
      const validation = BusinessRulesValidator.validateQuery(
        query,
        businessRules || ''
      );
      
      setValidationResult(validation);
      return validation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate query';
      setValidationError(errorMessage);
      
      // Return a default validation result on error
      const defaultValidation: BusinessRuleValidation = {
        isValid: true, // Allow query execution if validation fails
        errors: [],
        warnings: [],
        suggestions: []
      };
      
      setValidationResult(defaultValidation);
      return defaultValidation;
    } finally {
      setIsValidating(false);
    }
  }, [businessRules]);

  /**
   * Clear validation results
   */
  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setValidationError(null);
  }, []);

  /**
   * Check if query can be executed
   */
  const canExecuteQuery = useCallback((query: string): boolean => {
    if (!businessRules || !businessRules.trim()) {
      return true; // Allow execution if no business rules are configured
    }

    const validation = BusinessRulesValidator.validateQuery(query, businessRules);
    return validation.isValid;
  }, [businessRules]);

  /**
   * Get validation status for a query
   */
  const getValidationStatus = useCallback((query: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } => {
    if (!businessRules || !businessRules.trim()) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
    }

    return BusinessRulesValidator.validateQuery(query, businessRules);
  }, [businessRules]);

  return {
    // State
    validationResult,
    isValidating,
    validationError,
    
    // Actions
    validateQuery: validateQueryAgainstRules,
    clearValidation,
    
    // Computed
    canExecuteQuery,
    getValidationStatus,
    
    // State
    hasBusinessRules: !!businessRules && !!businessRules.trim()
  };
} 