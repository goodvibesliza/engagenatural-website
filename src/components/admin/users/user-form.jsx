import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { USER_ROLES } from '../../../contexts/auth-context';

// Zod schema for form validation
const userFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.enum(Object.values(USER_ROLES)),
  brandId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_verification']),
  verificationStatus: z.enum(['not_submitted', 'pending', 'verified', 'rejected']),
}).refine(data => {
  // If the role is brand_manager, brandId must be provided.
  if (data.role === USER_ROLES.BRAND_MANAGER) {
    return !!data.brandId && data.brandId.trim().length > 0;
  }
  return true;
}, {
  message: 'Brand ID is required for Brand Managers.',
  path: ['brandId'], // Specify the path of the error
});

export default function UserForm({ currentUser, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!currentUser;

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      role: currentUser?.role || USER_ROLES.COMMUNITY_USER,
      brandId: currentUser?.brandId || '',
      status: currentUser?.status || 'active',
      verificationStatus: currentUser?.verificationStatus || 'not_submitted',
    },
  });

  const selectedRole = form.watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Update existing user document
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new user document in Firestore.
        // Note: This does not create a Firebase Auth user. That's a separate process.
        const newUserRef = doc(collection(db, 'users'));
        await setDoc(newUserRef, {
          ...data,
          uid: newUserRef.id, // Storing the doc id as uid for consistency
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onSuccess(); // Trigger success callback (e.g., close dialog)
    } catch (err) {
      console.error('Error saving user data:', err);
      setError('Failed to save user data. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="user@example.com" {...field} disabled={isEditing} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(USER_ROLES).map(role => (
                      <SelectItem key={role} value={role}>
                        {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {selectedRole === USER_ROLES.BRAND_MANAGER && (
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Brand ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="verificationStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Status</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="not_submitted">Not Submitted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            isEditing ? 'Save Changes' : 'Create User'
          )}
        </Button>
      </form>
    </Form>
  );
}
