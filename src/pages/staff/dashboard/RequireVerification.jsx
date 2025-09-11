import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';

/**
 * RequireVerification - Guards content that requires verified status
 * If user is verified, renders children. Otherwise shows verification prompt.
 */
export default function RequireVerification({ children }) {
  const { user } = useAuth();
  
  // Check if user is verified (either through verified flag or verificationStatus)
  const isVerified = 
    user?.verified === true || 
    user?.verificationStatus === 'approved';
  
  if (isVerified) {
    return children;
  }
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium text-yellow-800 mb-2">Verification Required</h3>
      <p className="text-yellow-700 mb-4">
        This content requires verification. Please complete the verification process to access it.
      </p>
      <Link 
        to="/staff/verification" 
        className="inline-block bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Get Verified Now
      </Link>
    </div>
  );
}
