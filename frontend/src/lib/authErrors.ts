export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access temporarily blocked for security. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    case 'auth/unauthorized-domain':
      return 'Current domain or IP is not authorized in Firebase Console. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add "localhost" and "127.0.0.1".';
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not activated in this project. Please go to the Firebase Console -> Build -> Authentication -> click "Get Started" and enable Email/Password.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in your Firebase Console. Please enable Email/Password under Authentication -> Sign-in method.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups for this site.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}
