import { useRef } from 'react';

export default function StaffProfilePanel({
  user,
  profileImage,
  showAvatarSelector,
  setShowAvatarSelector,
  avatarOptions,
  uploadProfileImage,
  selectAvatar,
  getStatusBadge
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="font-heading text-xl font-semibold mb-4">Profile Information</h2>
      
      {/* Profile Image Section */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl overflow-hidden mx-auto">
            {profileImage ? (
              typeof profileImage === 'string' && profileImage.startsWith('http') ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profileImage}</span>
              )
            ) : (
              <span>👤</span>
            )}
          </div>
          <button
            onClick={() => setShowAvatarSelector(true)}
            className="absolute bottom-0 right-0 bg-brand-primary text-white rounded-full p-2 hover:bg-brand-primary/90"
          >
            📷
          </button>
        </div>
        
        {showAvatarSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="font-heading text-lg font-semibold mb-4">Choose Profile Picture</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        uploadProfileImage(e.target.files[0]);
                        setShowAvatarSelector(false);
                      }
                    }}
                    className="w-full"
                    ref={fileInputRef}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or Choose Avatar</label>
                  <div className="grid grid-cols-5 gap-2">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => selectAvatar(avatar)}
                        className="w-12 h-12 text-2xl hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAvatarSelector(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Name</p>
          <p className="font-medium">{user?.name || user?.displayName || 'New User'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Store</p>
          <p className="font-medium">{user?.storeName || user?.storeCode || 'Unknown Store'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Verification Status</p>
          <div className="mt-1">{getStatusBadge()}</div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Points</p>
          <p className="font-medium text-brand-primary">{user?.points || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Level</p>
          <p className="font-medium">{user?.level || 1}</p>
        </div>
      </div>
    </div>
  );
}
