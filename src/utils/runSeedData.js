// src/utils/runSeedData.js
import { seedBrandDashboardData, seedAll, seedTrainings, seedAnnouncements, 
  seedSampleRequests, seedTrainingProgress } from './seedFirestore';

/**
 * Utility to seed data for the EngageNatural brand dashboard
 * 
 * USAGE:
 * 1. Import in a component: import { runSeedData } from '../utils/runSeedData';
 * 2. Add a dev-only button: <button onClick={() => runSeedData()}>Seed Dashboard Data</button>
 * 3. Or from browser console: window.runSeedData()
 * 
 * OPTIONS:
 * - seedAll: Seed all data including templates and dashboard data
 * - seedDashboard: Seed only dashboard-related collections
 * - seedSpecific: Seed specific collections (trainings, announcements, etc.)
 */

// Make available in browser console for easy development testing
let isRegistered = false;

// Main function to run seeding with options
export const runSeedData = async ({ 
  mode = 'dashboard', // 'all', 'dashboard', or 'specific'
  collections = [], // For 'specific' mode: ['trainings', 'announcements', etc.]
  brandIds = ['brand1', 'brand2'], // Brand IDs to seed
  registerGlobal = true // Whether to register in window object
} = {}) => {
  // Register in window object if not already done
  if (registerGlobal && !isRegistered && typeof window !== 'undefined') {
    window.runSeedData = runSeedData;
    window.seedDashboard = () => runSeedData({ mode: 'dashboard' });
    window.seedAll = () => runSeedData({ mode: 'all' });
    isRegistered = true;
    console.log('✅ Seed functions registered in window object. Available commands:');
    console.log('  • window.runSeedData() - Run with default options');
    console.log('  • window.seedDashboard() - Seed dashboard data only');
    console.log('  • window.seedAll() - Seed all data including templates');
  }

  console.log(`🌱 Starting data seeding (mode: ${mode})...`);
  console.time('Seeding completed in');

  try {
    let result;
    
    switch (mode) {
      case 'all':
        console.log('🔄 Seeding all data (templates + dashboard)...');
        result = await seedAll();
        break;
        
      case 'dashboard':
        console.log('🔄 Seeding dashboard data...');
        result = await seedBrandDashboardData();
        break;
        
      case 'specific':
        if (!collections || collections.length === 0) {
          throw new Error('No collections specified for specific seeding mode');
        }
        
        console.log(`🔄 Seeding specific collections: ${collections.join(', ')}...`);
        
        // Seed trainings first if needed (since other collections depend on them)
        let trainings = [];
        if (collections.includes('trainings')) {
          trainings = await seedTrainings(brandIds);
          console.log(`✅ Seeded trainings for brands: ${brandIds.join(', ')}`);
        }
        
        // Seed other collections as requested
        const promises = [];
        
        if (collections.includes('announcements')) {
          promises.push(seedAnnouncements(brandIds));
        }
        
        if (collections.includes('sample_requests')) {
          promises.push(seedSampleRequests(brandIds));
        }
        
        if (collections.includes('training_progress') && trainings.length > 0) {
          promises.push(seedTrainingProgress(brandIds, trainings));
        } else if (collections.includes('training_progress')) {
          console.warn('⚠️ Cannot seed training_progress without trainings. Please include "trainings" in collections.');
        }
        
        await Promise.all(promises);
        result = true;
        break;
        
      default:
        throw new Error(`Invalid seeding mode: ${mode}`);
    }
    
    if (result) {
      console.log('✅ Data seeding completed successfully!');
      console.timeEnd('Seeding completed in');
      return { success: true };
    } else {
      console.error('❌ Data seeding failed');
      console.timeEnd('Seeding completed in');
      return { success: false, error: 'Unknown error during seeding' };
    }
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    console.timeEnd('Seeding completed in');
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Convenience function to seed dashboard data
export const seedDashboard = () => runSeedData({ mode: 'dashboard' });

// Convenience function to seed specific collections
export const seedSpecific = (collections, brandIds) => 
  runSeedData({ mode: 'specific', collections, brandIds });

// Export a component-ready function that returns a promise
export const seedDataAsync = (options = {}) => {
  return new Promise((resolve, reject) => {
    runSeedData({ ...options, registerGlobal: false })
      .then(result => {
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      })
      .catch(reject);
  });
};

export default runSeedData;
