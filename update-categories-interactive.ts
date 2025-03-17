import { db } from "./db";
import { questionCategories } from "../shared/schema";
import { updateQuestionsForCategory } from "./update-questions-single-category";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Updates each category one by one to avoid timeout issues
 * Takes a start and end index to process categories in batches
 */
async function updateCategoriesInteractive(startIndex = 0, count = 3) {
  try {
    console.log(`Starting interactive category update process from index ${startIndex}, count ${count}...`);
    
    // Get all categories
    const categories = await db.select().from(questionCategories).orderBy(questionCategories.orderIndex);
    console.log(`Found ${categories.length} categories in the database`);
    
    // Calculate end index (inclusive)
    const endIndex = Math.min(startIndex + count - 1, categories.length - 1);
    
    console.log(`Processing categories from index ${startIndex} to ${endIndex}`);
    
    // Update the specified batch of categories
    for (let i = startIndex; i <= endIndex; i++) {
      const category = categories[i];
      console.log(`Updating category ${i+1}/${categories.length}: ${category.name} (${category.id})`);
      
      try {
        // Use direct function call instead of subprocess for more reliable execution
        await updateQuestionsForCategory(category.id);
        console.log(`Completed update for ${category.name}`);
      } catch (error) {
        console.error(`Error updating category ${category.name}:`, error);
        // Continue with next category even if this one fails
      }
    }
    
    console.log(`Batch update completed for categories ${startIndex+1} to ${endIndex+1} of ${categories.length}`);
    
    if (endIndex < categories.length - 1) {
      console.log(`To continue with the next batch, run with: npx tsx update-categories-interactive.ts ${endIndex + 1} ${count}`);
    } else {
      console.log("All categories have been processed!");
    }
  } catch (error) {
    console.error("Error during interactive category updates:", error);
    throw error;
  }
}

// Run if directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line arguments
  const startIndex = parseInt(process.argv[2] || '0', 10);
  const count = parseInt(process.argv[3] || '3', 10);
  
  updateCategoriesInteractive(startIndex, count)
    .then(() => {
      console.log("Interactive category batch update completed successfully!");
      process.exit(0);
    })
    .catch(error => {
      console.error("Interactive category batch update failed:", error);
      process.exit(1);
    });
}