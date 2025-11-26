/**
 * E-Signature Validator Service
 * Validates e-signature data for legal validity
 */

export interface ESignatureData {
  name: string;
  email: string;
  consent: boolean;
  timestamp: string;
  ip: string;
  userAgent: string;
}

/**
 * Validate e-signature data
 */
export function validateESignature(signature: ESignatureData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!signature.name || signature.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!signature.email || !isValidEmail(signature.email)) {
    errors.push('Valid email is required');
  }

  if (!signature.consent) {
    errors.push('Consent is required');
  }

  if (!signature.timestamp || !isValidTimestamp(signature.timestamp)) {
    errors.push('Valid timestamp is required');
  }

  if (!signature.ip || signature.ip === 'Unknown') {
    errors.push('IP address is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verify signature timestamp is recent (within last 24 hours)
 */
export function isSignatureTimestampValid(timestamp: string): boolean {
  const sigTime = new Date(timestamp).getTime();
  const now = Date.now();
  const hoursDiff = (now - sigTime) / (1000 * 60 * 60);
  return hoursDiff <= 24 && hoursDiff >= 0;
}

/**
 * Check if IP address format is valid
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate timestamp format
 */
function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Create signature hash for additional security
 */
export function createSignatureHash(signature: ESignatureData): string {
  const data = `${signature.name}${signature.email}${signature.timestamp}${signature.ip}`;
  // In production, use a proper hashing function like crypto.createHash('sha256')
  return btoa(data).substring(0, 32);
}

