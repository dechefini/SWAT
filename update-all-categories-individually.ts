import { db } from "./db";
import { questionCategories } from "../shared/schema";
import { updateQuestionsForCategory } from "./update-questions-single-category";

/**
 * Runs the update script for each category individually to avoid timeout issues
 */
async function updateAllCategoriesIndividually() {
  try {
    console.log("Starting to update all categories individually...");
    
    // Get all categories
    const categories = await db.select().from(questionCategories);
    console.log(`Found ${categories.length} categories in the database`);
    
    // Process each category one by one
    for (const category of categories) {
      console.log(`Processing category: ${category.name} (${category.id})`);
      await updateQuestionsForCategory(category.id);
      console.log(`Completed update for category: ${category.name}`);
    }
    
    console.log("All categories have been updated successfully!");
  } catch (error) {
    console.error("Error during category updates:", error);
    throw error;
  }
}

// Run the function
updateAllCategoriesIndividually()
  .then(() => {
    console.log("All category updates completed successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Category updates failed:", error);
    process.exit(1);
  });