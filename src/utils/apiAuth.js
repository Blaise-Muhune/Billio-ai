import { authService } from '../services/authService';

/**
 * Authorization headers for authenticated /api calls.
 */
export async function authJsonHeaders() {
  const user = authService.getCurrentUser();
  if (!user) {
    throw new Error('User must be logged in');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}
