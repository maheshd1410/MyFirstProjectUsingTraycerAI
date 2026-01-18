interface ErrorMessageConfig {
  message: string;
  suggestion?: string;
}

const ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
  // Network Errors
  NETWORK_ERROR: {
    message: 'No internet connection',
    suggestion: 'Please check your connection and try again',
  },
  TIMEOUT_ERROR: {
    message: 'Request timed out',
    suggestion: 'Please try again',
  },
  
  // Auth Errors
  INVALID_CREDENTIALS: {
    message: 'Invalid email or password',
    suggestion: 'Please check your credentials',
  },
  UNAUTHORIZED: {
    message: 'You need to log in to continue',
    suggestion: 'Please log in to your account',
  },
  SESSION_EXPIRED: {
    message: 'Your session has expired',
    suggestion: 'Please log in again',
  },
  
  // Cart Errors
  CART_OFFLINE: {
    message: 'Cannot modify cart while offline',
    suggestion: 'Changes will be synced when you\'re back online',
  },
  CART_EMPTY: {
    message: 'Your cart is empty',
    suggestion: 'Add some items to continue',
  },
  
  // Product Errors
  PRODUCT_NOT_FOUND: {
    message: 'Product not found',
    suggestion: 'This product may no longer be available',
  },
  OUT_OF_STOCK: {
    message: 'Product is out of stock',
    suggestion: 'Try adding it to your wishlist',
  },
  
  // Order Errors
  ORDER_FAILED: {
    message: 'Failed to place order',
    suggestion: 'Please try again or contact support',
  },
  CHECKOUT_OFFLINE: {
    message: 'Cannot checkout while offline',
    suggestion: 'Please connect to the internet to complete your order',
  },
  
  // Payment Errors
  PAYMENT_FAILED: {
    message: 'Payment failed',
    suggestion: 'Please check your payment method and try again',
  },
  PAYMENT_DECLINED: {
    message: 'Payment was declined',
    suggestion: 'Please use a different payment method',
  },
  
  // Server Errors
  SERVER_ERROR: {
    message: 'Something went wrong',
    suggestion: 'Please try again later',
  },
  SERVICE_UNAVAILABLE: {
    message: 'Service temporarily unavailable',
    suggestion: 'We\'re working on it. Please try again shortly',
  },
  
  // Validation Errors
  VALIDATION_ERROR: {
    message: 'Invalid input',
    suggestion: 'Please check your information and try again',
  },
  
  // Generic
  UNKNOWN_ERROR: {
    message: 'An unexpected error occurred',
    suggestion: 'Please try again',
  },
};

export const getErrorMessage = (error: any): { message: string; suggestion?: string } => {
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }

  // Handle error objects
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  const statusCode = error.response?.status;

  // Network errors
  if (
    errorCode.includes('NETWORK') ||
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('offline')
  ) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (
    errorCode.includes('TIMEOUT') ||
    errorMessage.toLowerCase().includes('timeout')
  ) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // HTTP status code errors
  switch (statusCode) {
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return {
        message: 'Access denied',
        suggestion: 'You don\'t have permission to perform this action',
      };
    case 404:
      return {
        message: 'Not found',
        suggestion: 'The requested resource could not be found',
      };
    case 409:
      return {
        message: 'Conflict',
        suggestion: 'This action conflicts with existing data',
      };
    case 422:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 429:
      return {
        message: 'Too many requests',
        suggestion: 'Please wait a moment and try again',
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
  }

  // Specific error messages from backend
  const backendMessage = error.response?.data?.message || error.response?.data?.error;
  if (backendMessage) {
    return { message: backendMessage };
  }

  // Context-specific errors
  if (errorMessage.toLowerCase().includes('cart')) {
    return ERROR_MESSAGES.CART_OFFLINE;
  }

  if (errorMessage.toLowerCase().includes('checkout')) {
    return ERROR_MESSAGES.CHECKOUT_OFFLINE;
  }

  if (errorMessage.toLowerCase().includes('payment')) {
    return ERROR_MESSAGES.PAYMENT_FAILED;
  }

  if (errorMessage.toLowerCase().includes('credentials')) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  }

  if (errorMessage.toLowerCase().includes('stock')) {
    return ERROR_MESSAGES.OUT_OF_STOCK;
  }

  // Default to error message or generic error
  return {
    message: errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR.message,
    suggestion: ERROR_MESSAGES.UNKNOWN_ERROR.suggestion,
  };
};

// Get user-friendly error message for display
export const formatErrorForDisplay = (error: any): string => {
  const { message, suggestion } = getErrorMessage(error);
  return suggestion ? `${message}. ${suggestion}` : message;
};

// Check if error is recoverable
export const isRecoverableError = (error: any): boolean => {
  const statusCode = error.response?.status;
  const errorCode = error.code || '';

  // Network errors are recoverable
  if (
    errorCode.includes('NETWORK') ||
    errorCode.includes('TIMEOUT') ||
    error.message?.toLowerCase().includes('network')
  ) {
    return true;
  }

  // 5xx errors are recoverable (server issues)
  if (statusCode >= 500 && statusCode < 600) {
    return true;
  }

  // 408 (Request Timeout) and 429 (Too Many Requests) are recoverable
  if (statusCode === 408 || statusCode === 429) {
    return true;
  }

  return false;
};

export default {
  getErrorMessage,
  formatErrorForDisplay,
  isRecoverableError,
};
