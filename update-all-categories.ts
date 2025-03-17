import { db } from "./db";
import { questionCategories } from "../shared/schema";
import { updateCategoryQuestions } from "./update-category-questions";

/**
 * Updates all category questions in the database to match the official SWAT template
 */
async function updateAllCategories() {
  try {
    console.log("Starting to update all category questions...");
    
    // Get all categories
    const categories = await db.select().from(questionCategories);
    console.log(`Found ${categories.length} categories in the database`);
    
    let totalQuestions = 0;
    
    // Process each category one by one
    for (const category of categories) {
      console.log(`Processing category: ${category.name} (${category.id})`);
      try {
        const questionCount = await updateCategoryQuestions(category.id);
        if (questionCount) {
          totalQuestions += questionCount;
        }
      } catch (error) {
        console.error(`Error updating category ${category.name}:`, error);
        // Continue with next category even if this one fails
      }
    }
    
    console.log(`All categories updated successfully! Added ${totalQuestions} total questions.`);
    return totalQuestions;
  } catch (error) {
    console.error("Error during category updates:", error);
    throw error;
  }
}

// Run if this script is executed directly
async function main() {
  try {
    await updateAllCategories();
    console.log("Complete category update process finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Category update process failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}