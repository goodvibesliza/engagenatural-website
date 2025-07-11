// src/pages/admin/BrandEditorPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { useAuth } from '../../contexts/auth-context';

export default function BrandEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRoles } = useAuth();
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState({
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    managerId: '',
    managerName: '',
    templateIds: []
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  
  const isSuperAdmin = userRoles?.includes('super_admin');
  
  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/admin');
    }
  }, [isSuperAdmin, navigate]);
  
  // Fetch available brand managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoadingManagers(true);
        const managersQuery = query(
          collection(db, 'users'),
          where('roles', 'array-contains', 'brand_manager')
        );
        
        const snapshot = await getDocs(managersQuery);
        const managersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setManagers(managersList);
      } catch (error) {
        console.error("Error fetching managers:", error);
      } finally {
        setLoadingManagers(false);
      }
    };
    
    fetchManagers();
  }, []);
  
  // Fetch existing brand if editing
  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    
    const fetchBrand = async () => {
      try {
        const brandRef = doc(db, 'brands', id);
        const brandDoc = await getDoc(brandRef);
        
        if (brandDoc.exists()) {
          const brandData = brandDoc.data();
          setBrand(brandData);
          if (brandData.logoUrl) {
            setLogoPreview(brandData.logoUrl);
          }
        } else {
          console.error("Brand not found");
          navigate('/admin/brands');
        }
      } catch (error) {
        console.error("Error fetching brand:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrand();
  }, [id, isNew, navigate]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBrand(prev => ({ ...prev, [name]: value }));
    
    // Handle manager selection
    if (name === 'managerId' && value) {
      const selectedManager = managers.find(m => m.id === value);
      if (selectedManager) {
        setBrand(prev => ({ 
          ...prev, 
          managerId: value,
          managerName: selectedManager.displayName || selectedManager.email
        }));
      }
    }
  };
  
  // Handle logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let logoUrl = brand.logoUrl;
      
      // Upload logo if changed
      if (logoFile) {
        const logoRef = ref(storage, `brands/${Date.now()}_${logoFile.name}`);
        const uploadResult = await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Prepare brand data
      const brandData = {
        ...brand,
        logoUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || 'unknown'
      };
      
      if (isNew) {
        // Create new brand
        brandData.createdAt = serverTimestamp();
        brandData.createdBy = user?.uid || 'unknown';
        
        const newBrandRef = await addDoc(collection(db, 'brands'), brandData);
        navigate(`/admin/brands/${newBrandRef.id}`);
      } else {
        // Update existing brand
        await setDoc(doc(db, 'brands', id), brandData, { merge: true });
        navigate(`/admin/brands/${id}`);
      }
    } catch (error) {
      console.error("Error saving brand:", error);
      alert(`Failed to save brand: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout requireSuperAdmin={true}>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading brand data...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout requireSuperAdmin={true}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isNew ? 'Create New Brand' : 'Edit Brand'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={brand.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={brand.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={brand.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            {/* Logo Upload */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Brand Logo</h2>
              
              <div className="flex items-start space-x-4">
                <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="mt-1 block text-xs">No logo</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended size: 512x512 pixels. PNG or JPG format.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Manager Assignment */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Brand Manager</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Manager
                </label>
                
                {loadingManagers ? (
                  <div className="py-2">Loading managers...</div>
                ) : managers.length > 0 ? (
                  <select
                    name="managerId"
                    value={brand.managerId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select a manager --</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.displayName || manager.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="py-2 text-yellow-600">
                    No brand managers available. Add users with the brand_manager role first.
                  </div>
                )}
                
                <p className="mt-1 text-xs text-gray-500">
                  The assigned manager will be able to edit content for this brand.
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/brands')}
              className="px-4 py-2 border border-gray-300 rounded shadow-sm bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? 'Saving...' : isNew ? 'Create Brand' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
