#!/usr/bin/env node
/* eslint-env node */
/**
 * netlify-setup.js
 * 
 * This script fixes import path issues before the build process by replacing
 * problematic alias imports with relative imports. Specifically:
 * - @/lib/utils imports are replaced with ../../lib/utils
 * - @/components/ui/* imports are replaced with ./*
 * 
 * This helps prevent Vite build failures in production environments where
 * path alias resolution might not work as expected.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const UI_COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components', 'ui');
const LIB_UTILS_REGEX = /from\s+["']@\/lib\/utils["']/g;
const COMPONENT_IMPORT_REGEX = /from\s+["']@\/components\/ui\/([^"']+)["']/g;
const LIB_UTILS_REPLACEMENT = 'from "../../lib/utils"';

console.log('🔧 Starting Netlify setup script - fixing import paths...');
console.log(`📂 Scanning directory: ${UI_COMPONENTS_DIR}`);

/**
 * Process a single file to replace imports
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if file was modified, false otherwise
 */
function processFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File does not exist: ${filePath}`);
      return false;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let modified = false;
    
    // Replace @/lib/utils imports
    if (LIB_UTILS_REGEX.test(content)) {
      updatedContent = updatedContent.replace(LIB_UTILS_REGEX, LIB_UTILS_REPLACEMENT);
      modified = true;
    }
    
    // Reset the regex lastIndex (important for global regex)
    LIB_UTILS_REGEX.lastIndex = 0;
    
    // Replace @/components/ui/* imports with relative imports (./)
    if (COMPONENT_IMPORT_REGEX.test(content)) {
      updatedContent = updatedContent.replace(
        COMPONENT_IMPORT_REGEX, 
        (match, componentName) => `from "./${componentName}"`
      );
      modified = true;
    }
    
    // Reset the regex lastIndex
    COMPONENT_IMPORT_REGEX.lastIndex = 0;
    
    // Write the updated content back to the file if modified
    if (modified) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Process all files in the UI components directory
 */
function fixImports() {
  try {
    // Check if directory exists
    if (!fs.existsSync(UI_COMPONENTS_DIR)) {
      console.error(`❌ Directory not found: ${UI_COMPONENTS_DIR}`);
      console.error('Make sure you are running this script from the project root.');
      process.exit(1);
    }
    
    // Get all files in the directory
    const files = fs.readdirSync(UI_COMPONENTS_DIR);
    let modifiedCount = 0;
    
    // Process each file
    files.forEach(file => {
      // Only process JSX files
      if (file.endsWith('.jsx')) {
        const filePath = path.join(UI_COMPONENTS_DIR, file);
        const wasModified = processFile(filePath);
        
        if (wasModified) {
          console.log(`✅ Fixed imports in: ${file}`);
          modifiedCount++;
        }
      }
    });
    
    // Summary
    console.log('\n=== Import Path Fix Summary ===');
    console.log(`📊 Total JSX files processed: ${files.filter(f => f.endsWith('.jsx')).length}`);
    console.log(`🔄 Files modified: ${modifiedCount}`);
    
    if (modifiedCount > 0) {
      console.log('\n✨ Import statements fixed successfully!');
    } else {
      console.log('\n🔍 No files needed to be modified.');
    }
    
    return modifiedCount > 0;
  } catch (error) {
    console.error('❌ Error reading UI components directory:', error);
    process.exit(1);
  }
}

// Execute the import fixing function
const _importsFixed = fixImports();

// Exit with success
console.log('🎉 Netlify setup completed successfully!');
process.exit(0);
