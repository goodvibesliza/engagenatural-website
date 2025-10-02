// src/lib/trainingAdapter.js
// Pure functions to fetch and normalize training data for brand managers

import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as limitQuery, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';

/**
 * Fetch training list for a specific brand with optional search and limit
 * @param {Object} params - Query parameters
 * @param {string} params.brandId - Brand ID to filter trainings
 * @param {string} [params.query] - Optional search query for title filtering
 * @param {number} [params.limit=20] - Maximum number of results
 * @returns {Promise<Array>} Array of normalized training objects
 */
export async function listBrandTrainings({ brandId, query: searchQuery = '', limit = 20 }) {
  if (!brandId) {
    throw new Error('brandId is required for listBrandTrainings');
  }

  try {
    // Build Firestore query
    let firestoreQuery = query(
      collection(db, 'trainings'),
      where('brandId', '==', brandId),
      where('published', '==', true), // Only show published trainings
      orderBy('updatedAt', 'desc'),
      limitQuery(Math.min(limit, 100)) // Cap at 100 for performance
    );

    const snapshot = await getDocs(firestoreQuery);
    let trainings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side filtering by title if search query provided
    if (searchQuery && searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      trainings = trainings.filter(training => 
        training.title?.toLowerCase().includes(queryLower) ||
        training.description?.toLowerCase().includes(queryLower)
      );
    }

    // Normalize and return
    return trainings.map(normalizeTraining);
  } catch (error) {
    console.error('Error fetching brand trainings:', error);
    throw error;
  }
}

/**
 * Normalize raw training data into consistent format
 * @param {Object} raw - Raw training data from Firestore
 * @returns {Object} Normalized training object
 */
export function normalizeTraining(raw) {
  if (!raw) {
    return null;
  }

  return {
    id: raw.id || '',
    title: raw.title || 'Untitled Training',
    status: raw.published ? 'published' : 'draft',
    updatedAt: raw.updatedAt?.toDate ? raw.updatedAt.toDate() : new Date(raw.updatedAt || Date.now()),
    brandId: raw.brandId || '',
    description: raw.description || '',
    // Include any other fields that might be needed
    duration: raw.duration || null,
    type: raw.type || 'training'
  };
}

/**
 * Format relative time for display (helper function)
 * @param {Date} date - Date to format
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date) {
  if (!date || !(date instanceof Date)) {
    return 'Unknown';
  }

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Find a single training by ID
 * @param {string} trainingId - Training ID to find
 * @returns {Promise<Object|null>} Normalized training object or null
 */
export async function findTrainingById(trainingId) {
  if (!trainingId) return null;

  try {
    const docRef = doc(db, 'trainings', trainingId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return normalizeTraining({
      id: docSnap.id,
      ...docSnap.data()
    });
  } catch (error) {
    console.error('Error finding training by ID:', error);
    return null;
  }
}

/**
 * Validate that a training belongs to the specified brand
 * @param {Object} training - Normalized training object
 * @param {string} brandId - Brand ID to validate against
 * @returns {boolean} True if training belongs to brand
 */
export function validateTrainingBrand(training, brandId) {
  return training && training.brandId === brandId;
}