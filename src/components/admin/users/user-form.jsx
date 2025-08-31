// src/components/admin/users/user-form.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { USER_ROLES } from '../../../contexts/auth-context';

// Zod schema for form validation
const userFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['super_admin', 'brand_manager', 'staff', 'verified_staff', 'retail_staff', 'user', 'guest']),
  verified: z.boolean().default(false),
  verificationStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  brandId: z.string().optional(),
});

export default function UserForm({ currentUser, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(currentUser?.role || 'user');

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      role: currentUser?.role || 'user',
      verified: currentUser?.verified || false,
      verificationStatus: currentUser?.verificationStatus || 'pending',
      brandId: currentUser?.brandId || '',
    },
  });

  const watchedRole = form.watch('role');
  
  useEffect(() => {
    setSelectedRole(watchedRole);
  }, [watchedRole]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const userData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (currentUser?.id) {
        // Update existing user
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, userData);
      } else {
        // Create new user
        userData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'users'), userData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {currentUser ? 'Edit User' : 'Add New User'}
        </CardTitle>
        <CardDescription>
          {currentUser 
            ? 'Update the user information below.' 
            : 'Fill in the details to create a new user account.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
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
                      <Input placeholder="Enter last name" {...field} />
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
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {USER_ROLES.map(roleOption => (
                        <SelectItem key={roleOption.value} value={roleOption.value}>
                          {roleOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === 'brand_manager' && (
              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter brand ID (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="verified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Verified User</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Mark this user as verified
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    </FormControl>
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[100px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  currentUser ? 'Update User' : 'Create User'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}