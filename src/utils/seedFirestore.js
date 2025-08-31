// src/utils/seedFirestore.js
import { collection, doc, setDoc, serverTimestamp, Timestamp, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Seed test templates for development
export const seedTemplates = async () => {
  console.log("Seeding templates to Firestore...");
  
  try {
    // Lesson template example
    await setDoc(doc(db, "templates", "template-lesson-1"), {
      name: "Standard Lesson Template",
      description: "A standard template for creating lesson content with text, image, and quiz sections",
      type: "lesson",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "admin",
      isGlobal: true,
      sections: [
        {
          id: "section-intro",
          type: "text",
          title: "Introduction",
          required: true,
          placeholder: "Introduce your lesson topic here...",
          editorConfig: {
            toolbar: ["bold", "italic", "heading", "link"]
          }
        },
        {
          id: "section-content",
          type: "text",
          title: "Main Content",
          required: true,
          placeholder: "Add the main lesson content here...",
          editorConfig: {
            toolbar: ["bold", "italic", "heading", "link", "image", "list"]
          }
        },
        {
          id: "section-image",
          type: "image",
          title: "Featured Image",
          required: false,
          placeholder: "Upload an image for this lesson"
        },
        {
          id: "section-quiz",
          type: "quiz",
          title: "Knowledge Check",
          required: false,
          placeholder: "Add quiz questions to test understanding",
          quizConfig: {
            minQuestions: 1,
            maxQuestions: 5,
            passingScore: 70
          }
        }
      ]
    });
    
    // Community template example
    await setDoc(doc(db, "templates", "template-community-1"), {
      name: "Standard Community Template",
      description: "A standard template for creating online communities with discussion areas and resources",
      type: "community",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "admin",
      isGlobal: true,
      sections: [
        {
          id: "section-about",
          type: "text",
          title: "About This Community",
          required: true,
          placeholder: "Describe what this community is about and who it's for"
        },
        {
          id: "section-discussions",
          type: "discussion",
          title: "Discussions",
          required: true,
          discussionConfig: {
            categories: ["General", "Questions", "Announcements"],
            requireApproval: false
          }
        },
        {
          id: "section-resources",
          type: "resources",
          title: "Resources",
          required: false,
          resourcesConfig: {
            types: ["documents", "links", "videos"]
          }
        },
        {
          id: "section-events",
          type: "events",
          title: "Events",
          required: false,
          eventsConfig: {
            allowRSVP: true
          }
        }
      ]
    });
    
    console.log("✓ Templates seeded successfully");
    return true;
  } catch (error) {
    console.error("Error seeding templates:", error);
    return false;
  }
};

// Helper function to generate a random date within the past N days
const randomDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  // Add random hours and minutes
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return Timestamp.fromDate(date);
};

// Helper function to pick a random item from an array
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to generate a random number between min and max
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate a random boolean with probability
const randomBoolean = (probability = 0.5) => Math.random() < probability;

// Seed trainings collection
export const seedTrainings = async (brandIds) => {
  console.log("Seeding trainings to Firestore...");
  
  const trainingTypes = ['video', 'article', 'quiz', 'training'];
  const productCategories = [
    'Essential Oils', 'Aromatherapy', 'Natural Skincare', 
    'Organic Supplements', 'Wellness Products', 'Eco-Friendly Home'
  ];
  
  const trainings = [];
  
  try {
    for (const brandId of brandIds) {
      console.log(`Creating trainings for brand: ${brandId}`);
      
      // Create 10 trainings per brand
      for (let i = 0; i < 10; i++) {
        const trainingType = randomItem(trainingTypes);
        const productCategory = randomItem(productCategories);
        const createdAt = randomDate(30); // Within last 30 days
        
        const trainingData = {
          brandId,
          title: `${productCategory} ${trainingType.charAt(0).toUpperCase() + trainingType.slice(1)} ${i + 1}`,
          description: `Learn all about ${productCategory} in this engaging ${trainingType}. Perfect for retail staff training.`,
          content: `This comprehensive ${trainingType} covers everything you need to know about ${productCategory}. From key benefits to customer questions, you'll be an expert in no time.`,
          type: trainingType,
          category: productCategory,
          published: randomBoolean(0.9), // 90% are published
          featured: randomBoolean(0.3), // 30% are featured
          createdAt,
          updatedAt: createdAt,
          duration: randomNumber(5, 30), // Duration in minutes
          difficulty: randomItem(['beginner', 'intermediate', 'advanced']),
          authorName: randomItem(['Sarah Johnson', 'Michael Chen', 'Priya Patel', 'David Wilson']),
          authorTitle: randomItem(['Product Specialist', 'Training Manager', 'Education Director', 'Content Creator']),
          thumbnailUrl: `https://source.unsplash.com/random/300x200?${productCategory.toLowerCase().replace(' ', ',')}`,
          tags: [productCategory.toLowerCase(), trainingType, 'retail', 'education'],
          objectives: [
            `Understand the key benefits of ${productCategory}`,
            `Learn how to explain ${productCategory} to customers`,
            `Master the sales techniques for ${productCategory}`,
            `Handle common questions about ${productCategory}`
          ],
          completionReward: randomNumber(5, 20),
        };
        
        const docRef = await addDoc(collection(db, "trainings"), trainingData);
        trainings.push({ id: docRef.id, ...trainingData });
      }
    }
    
    console.log(`✓ Created ${trainings.length} trainings`);
    return trainings;
  } catch (error) {
    console.error("Error seeding trainings:", error);
    throw error;
  }
};

// Seed announcements collection
export const seedAnnouncements = async (brandIds) => {
  console.log("Seeding announcements to Firestore...");
  
  const priorities = ['high', 'medium', 'low'];
  const categories = ['news', 'product', 'event', 'update'];
  
  try {
    for (const brandId of brandIds) {
      console.log(`Creating announcements for brand: ${brandId}`);
      
      // Create 5 announcements per brand
      for (let i = 0; i < 5; i++) {
        const createdAt = randomDate(30); // Within last 30 days
        const priority = randomItem(priorities);
        const category = randomItem(categories);
        
        await addDoc(collection(db, "announcements"), {
          brandId,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)}: ${['New Product Launch', 'Training Update', 'Sales Contest', 'Company News', 'Upcoming Event'][i % 5]}`,
          content: `This is an important ${priority} priority announcement about ${category}. Please read and take appropriate action.`,
          createdAt,
          updatedAt: createdAt,
          priority,
          author: randomItem(['Sarah Johnson', 'Michael Chen', 'Priya Patel', 'David Wilson']),
          authorTitle: randomItem(['Brand Manager', 'Marketing Director', 'CEO', 'Training Coordinator']),
          category,
          expiresAt: randomBoolean(0.3) 
            ? Timestamp.fromDate(new Date(createdAt.toDate().getTime() + 1000 * 60 * 60 * 24 * randomNumber(7, 30))) 
            : null,
          imageUrl: randomBoolean(0.6) ? `https://source.unsplash.com/random/600x400?announcement,${category}` : null,
          link: randomBoolean(0.4) ? 'https://www.engagenatural.com/news' : null,
        });
      }
    }
    
    console.log(`✓ Created ${brandIds.length * 5} announcements`);
    return true;
  } catch (error) {
    console.error("Error seeding announcements:", error);
    throw error;
  }
};

// Seed sample requests collection
export const seedSampleRequests = async (brandIds) => {
  console.log("Seeding sample requests to Firestore...");
  
  const statuses = ['pending', 'approved', 'fulfilled', 'rejected'];
  const productCategories = [
    'Essential Oils', 'Aromatherapy', 'Natural Skincare', 
    'Organic Supplements', 'Wellness Products', 'Eco-Friendly Home'
  ];
  
  try {
    for (const brandId of brandIds) {
      console.log(`Creating sample requests for brand: ${brandId}`);
      
      // Create 15 sample requests per brand
      for (let i = 0; i < 15; i++) {
        const createdAt = randomDate(30); // Within last 30 days
        const status = randomItem(statuses);
        const productCategory = randomItem(productCategories);
        const productName = `${['Essential', 'Natural', 'Organic', 'Pure', 'Eco'][i % 5]} ${productCategory} ${['Sample', 'Starter', 'Trial', 'Kit', 'Pack'][i % 5]}`;
        
        await addDoc(collection(db, "sample_requests"), {
          brandId,
          customerName: randomItem(['John Smith', 'Emma Johnson', 'Carlos Rodriguez', 'Aisha Patel', 'Sam Taylor']),
          customerEmail: `customer${i}@example.com`,
          customerPhone: `555-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`,
          productName,
          productCategory,
          quantity: randomNumber(1, 5),
          requestReason: `Customer interested in ${productCategory} for their store. Would like samples to test with staff.`,
          status,
          createdAt,
          updatedAt: createdAt,
          fulfillmentDate: status === 'fulfilled' 
            ? Timestamp.fromDate(new Date(createdAt.toDate().getTime() + 1000 * 60 * 60 * 24 * randomNumber(1, 7))) 
            : null,
          notes: randomBoolean(0.7) ? `Follow up with customer about ${productCategory} training materials` : null,
          storeLocation: randomItem(['Seattle, WA', 'Portland, OR', 'San Francisco, CA', 'Austin, TX', 'Denver, CO']),
          storeId: `store_${randomNumber(1000, 9999)}`,
        });
      }
    }
    
    console.log(`✓ Created ${brandIds.length * 15} sample requests`);
    return true;
  } catch (error) {
    console.error("Error seeding sample requests:", error);
    throw error;
  }
};

// Seed training progress collection
export const seedTrainingProgress = async (brandIds, trainings) => {
  console.log("Seeding training progress to Firestore...");
  
  const statuses = ['completed', 'in_progress', 'not_started'];
  const usersPerBrand = 20;
  
  try {
    for (const brandId of brandIds) {
      console.log(`Creating training progress for brand: ${brandId}`);
      
      // Create user IDs for this brand
      const userIds = Array.from({ length: usersPerBrand }, (_, i) => `user_${brandId}_${i + 1}`);
      
      // Get trainings for this brand
      const brandTrainings = trainings.filter(training => training.brandId === brandId);
      
      // For each training, create progress records
      for (const training of brandTrainings) {
        console.log(`Creating progress records for training: ${training.title}`);
        
        // Create 15 progress records per training
        for (let i = 0; i < 15; i++) {
          // Randomly select a user
          const userId = randomItem(userIds);
          const updatedAt = randomDate(30); // Within last 30 days
          const status = randomItem(statuses);
          
          // Calculate view and engagement counts based on status
          let viewCount, engagementCount;
          
          if (status === 'completed') {
            viewCount = randomNumber(5, 15);
            engagementCount = randomNumber(3, viewCount);
          } else if (status === 'in_progress') {
            viewCount = randomNumber(1, 8);
            engagementCount = randomNumber(1, viewCount);
          } else {
            viewCount = randomBoolean(0.3) ? randomNumber(1, 3) : 0;
            engagementCount = randomBoolean(0.5) ? randomNumber(0, viewCount) : 0;
          }
          
          await addDoc(collection(db, "training_progress"), {
            trainingId: training.id,
            userId,
            brandId,
            status,
            progress: status === 'completed' ? 100 : status === 'in_progress' ? randomNumber(10, 90) : 0,
            createdAt: updatedAt, // Simplified: using same timestamp for creation and update
            updatedAt,
            viewCount,
            engagementCount,
            completedAt: status === 'completed' ? updatedAt : null,
            lastPosition: status !== 'not_started' ? randomNumber(0, 100) : 0,
            timeSpent: status !== 'not_started' ? randomNumber(30, 1800) : 0, // seconds
            score: status === 'completed' ? randomNumber(60, 100) : null,
            feedback: status === 'completed' ? randomNumber(1, 5) : null, // 1-5 star rating
          });
        }
      }
    }
    
    console.log(`✓ Created training progress records for ${brandIds.length} brands`);
    return true;
  } catch (error) {
    console.error("Error seeding training progress:", error);
    throw error;
  }
};

// Main function to seed brand dashboard data
export const seedBrandDashboardData = async () => {
  console.log("Seeding brand dashboard data to Firestore...");
  
  try {
    // Use brand IDs from seed-data.json
    const brandIds = ["brand1", "brand2"];
    
    // Seed trainings first to get their references
    const trainings = await seedTrainings(brandIds);
    
    // Seed other collections
    await Promise.all([
      seedAnnouncements(brandIds),
      seedSampleRequests(brandIds),
      seedTrainingProgress(brandIds, trainings)
    ]);
    
    console.log("✓ Brand dashboard data seeded successfully");
    return true;
  } catch (error) {
    console.error("Error seeding brand dashboard data:", error);
    return false;
  }
};

// Seed all data
export const seedAll = async () => {
  console.log("Starting full data seeding process...");
  
  try {
    // Seed templates
    await seedTemplates();
    
    // Seed brand dashboard data
    await seedBrandDashboardData();
    
    console.log("✓ All data seeded successfully");
    return true;
  } catch (error) {
    console.error("Error seeding all data:", error);
    return false;
  }
};

// Export all functions
export default {
  seedTemplates,
  seedTrainings,
  seedAnnouncements,
  seedSampleRequests,
  seedTrainingProgress,
  seedBrandDashboardData,
  seedAll
};
