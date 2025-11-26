/**
 * Centralized error handling utility
 * Converts errors to user-friendly messages
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  type: 'error' | 'warning' | 'info';
}

export class AppError extends Error {
  code?: string;
  type: 'error' | 'warning' | 'info';

  constructor(message: string, code?: string, type: 'error' | 'warning' | 'info' = 'error') {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.type = type;
  }
}

/**
 * Converts various error types to user-friendly messages
 */
export function handleError(error: unknown): ErrorInfo {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      type: error.type,
    };
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string };
    
    // Map common Supabase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      '23505': 'This record already exists. Please try again.',
      '23503': 'Invalid reference. Please check your input.',
      'PGRST116': 'No data found.',
      'invalid_credentials': 'Invalid email or password. Please try again.',
      'signup_disabled': 'Sign up is currently disabled. Please contact support.',
      'email_not_confirmed': 'Please confirm your email address before signing in.',
      'invalid_password': 'Password is too weak. Please use a stronger password.',
    };

    const code = supabaseError.code || '';
    const userMessage = errorMessages[code] || supabaseError.message || 'An unexpected error occurred. Please try again.';

    return {
      message: userMessage,
      code,
      type: 'error',
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred. Please try again.',
      type: 'error',
    };
  }

  // Fallback for unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'error',
  };
}

/**
 * Logs error to console (only in development)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    const prefix = context ? `[${context}]` : '';
    
    // Better error serialization
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, any>;
      const serialized = {
        message: errorObj.message || 'No error message',
        code: errorObj.code,
        details: errorObj.details,
        hint: errorObj.hint,
        name: errorObj.name || (error instanceof Error ? error.name : undefined),
        stack: error instanceof Error ? error.stack : undefined,
        // Try to stringify if it's a plain object
        ...(Object.keys(errorObj).length > 0 ? { raw: JSON.parse(JSON.stringify(errorObj, null, 2)) } : {}),
      };
      console.error(`${prefix}`, serialized);
    } else if (error instanceof Error) {
      console.error(`${prefix}`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    } else {
      // Fallback for other types
      console.error(`${prefix}`, error);
    }
  }
}

