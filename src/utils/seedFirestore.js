// src/utils/seedFirestore.js
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
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
