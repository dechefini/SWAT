import { db } from "./db";
import { eq } from "drizzle-orm";
import { questionCategories } from "../shared/schema";

/**
 * Updates all category names to remove any numerical prefixes
 */
async function removeCategoryNumbers() {
  try {
    console.log("Starting category name cleanup...");
    
    // Get all existing categories
    const allCategories = await db.select().from(questionCategories);
    console.log(`Found ${allCategories.length} categories`);
    
    for (const category of allCategories) {
      // Check if the category name starts with a number pattern (e.g., "1. ", "12. ", etc.)
      const numberPattern = /^\d+\.\s+/;
      
      if (numberPattern.test(category.name)) {
        // Remove the number prefix
        const cleanName = category.name.replace(numberPattern, '');
        console.log(`Updating category: "${category.name}" -> "${cleanName}"`);
        
        // Update the category name in the database
        await db.update(questionCategories)
          .set({ name: cleanName })
          .where(eq(questionCategories.id, category.id));
      }
    }
    
    // Handle duplicate categories (keep the one with the lower order_index)
    const updatedCategories = await db.select().from(questionCategories);
    
    // Group categories by name
    const categoryGroups: Record<string, any[]> = {};
    
    // Find duplicates
    for (const category of updatedCategories) {
      if (!categoryGroups[category.name]) {
        categoryGroups[category.name] = [category];
      } else {
        categoryGroups[category.name].push(category);
      }
    }
    
    // Process duplicates
    for (const name in categoryGroups) {
      const categories = categoryGroups[name];
      
      if (categories.length > 1) {
        console.log(`Found ${categories.length} duplicates for "${name}"`);
        
        // Sort by order_index to keep the one with the lowest value
        categories.sort((a, b) => (a.order_index || 999) - (b.order_index || 999));
        
        // Keep the first one, delete the rest
        for (let i = 1; i < categories.length; i++) {
          console.log(`Deleting duplicate category "${name}" with ID ${categories[i].id}`);
          try {
            await db.delete(questionCategories)
              .where(eq(questionCategories.id, categories[i].id));
            console.log(`Deleted category ${categories[i].id}`);
          } catch (err) {
            console.error(`Failed to delete category ${categories[i].id}:`, err);
          }
        }
      }
    }
    
    console.log("Category name cleanup completed successfully");
  } catch (error) {
    console.error("Error updating category names:", error);
    throw error;
  }
}

// Execute the function
removeCategoryNumbers()
  .then(() => {
    console.log("Category name cleanup script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Category name cleanup script failed:", error);
    process.exit(1);
  });

export default removeCategoryNumbers;