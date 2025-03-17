import { db } from './db';
import { questionCategories } from '../shared/schema';
import { updateQuestionsForCategory } from './update-questions-single-category';

/**
 * Updates categories in batches to avoid timeout issues
 * @param startIndex The starting index (0-based) of the category batch
 * @param count The number of categories to process in this batch
 */
async function updateCategoriesBatch(startIndex = 0, count = 3) {
  console.log(`Starting update for categories batch: [${startIndex} to ${startIndex + count - 1}]`);
  
  try {
    // Get all categories ordered by orderIndex
    const allCategories = await db.select().from(questionCategories).orderBy(questionCategories.orderIndex);
    
    // Get the specific batch of categories
    const categoryBatch = allCategories.slice(startIndex, startIndex + count);
    
    if (categoryBatch.length === 0) {
      console.log(`No categories found in range [${startIndex} to ${startIndex + count - 1}]`);
      return;
    }
    
    console.log(`Processing ${categoryBatch.length} categories in this batch:`);
    console.log(categoryBatch.map(c => `${c.name} (${c.id})`).join('\n'));
    
    // Process categories in the batch sequentially
    for (const category of categoryBatch) {
      console.log(`Processing category: ${category.name} (${category.id})`);
      try {
        await updateQuestionsForCategory(category.id);
        console.log(`Successfully updated category: ${category.name}`);
      } catch (error) {
        console.error(`Error updating category ${category.name}:`, error);
        // Continue with next category even if one fails
      }
      
      // Brief pause between categories to avoid database stress
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Batch update completed for categories [${startIndex} to ${startIndex + count - 1}]!`);
    
    // Provide information about the next batch
    if (startIndex + count < allCategories.length) {
      console.log(`To update the next batch, run: npx tsx update-categories-batch.ts ${startIndex + count} ${count}`);
    } else {
      console.log("All categories have been processed!");
    }
  } catch (error) {
    console.error("Error during batch update:", error);
    throw error;
  }
}

// Run if directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line arguments
  const startIndex = process.argv.length > 2 ? parseInt(process.argv[2]) : 0;
  const count = process.argv.length > 3 ? parseInt(process.argv[3]) : 3;
  
  updateCategoriesBatch(startIndex, count)
    .then(() => {
      console.log("Batch update completed successfully!");
      process.exit(0);
    })
    .catch(error => {
      console.error("Batch update failed:", error);
      process.exit(1);
    });
}

export { updateCategoriesBatch };