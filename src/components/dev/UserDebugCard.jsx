import { useAuth } from "../../contexts/auth-context";

/**
 * Debug component that shows current user information
 * Only renders in development mode
 */
export default function UserDebugCard() {
  // Don't render anything in production
  if (!import.meta.env.DEV) {
    return null;
  }

  const { user } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs bg-gray-800/80 text-white p-3 rounded-lg shadow-lg text-xs font-mono">
      <h4 className="font-bold mb-1 text-gray-300">User Debug</h4>
      {user ? (
        <div className="space-y-1">
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-gray-400">uid:</span>
            <span className="truncate">{user.uid}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-gray-400">role:</span>
            <span>{user.role || "undefined"}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-gray-400">approved:</span>
            <span>{user.approved === true ? "true" : "false"}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-gray-400">brandId:</span>
            <span className="truncate">{user.brandId || "null"}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="text-gray-400">retailerId:</span>
            <span className="truncate">{user.retailerId || "null"}</span>
          </div>
        </div>
      ) : (
        <div className="italic text-gray-400">No user</div>
      )}
    </div>
  );
}
