import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';

export default function PendingApproval() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/?logout=1');
    } catch (error) {
      // Silent error handling - no console logs
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Your account is pending approval
        </h1>
        <p className="text-gray-600 mb-8">
          We'll email you when it's live.
        </p>
        <Button 
          onClick={handleLogout}
          className="flex items-center justify-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Back to home
        </Button>
      </div>
    </div>
  );
}
