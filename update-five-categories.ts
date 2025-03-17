import { db } from './db';
import { questionCategories } from '@shared/schema';
import { updateQuestionsForCategory } from './update-questions-single-category';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

/**
 * This script will update five categories one by one
 */
async function updateFiveCategories(startIndex = 0, count = 5) {
  console.log(`Starting update of categories from index ${startIndex} to ${startIndex + count - 1}...`);

  try {
    // Get categories sorted by order index
    const allCategories = await db.select()
      .from(questionCategories)
      .orderBy(questionCategories.orderIndex);

    // Calculate end index (make sure it doesn't exceed array length)
    const endIndex = Math.min(startIndex + count, allCategories.length);
    const categoriesToProcess = allCategories.slice(startIndex, endIndex);

    console.log(`Found ${allCategories.length} categories in total`);
    console.log(`Will process ${categoriesToProcess.length} categories (${startIndex} to ${endIndex - 1})`);

    // Process selected categories
    for (const category of categoriesToProcess) {
      console.log(`Processing category ${category.orderIndex}: ${category.name}`);
      await updateQuestionsForCategory(category.id);
      console.log(`Completed category ${category.orderIndex}: ${category.name}`);
      
      // Add a small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Successfully updated categories from index ${startIndex} to ${endIndex - 1}`);
  } catch (error) {
    console.error('Error updating categories:', error);
    throw error;
  }
}

// For running script directly via command line
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  // Parse command line arguments for start index and count
  const args = process.argv.slice(2);
  const startIndex = parseInt(args[0] || '0', 10);
  const count = parseInt(args[1] || '5', 10);

  updateFiveCategories(startIndex, count)
    .then(() => {
      console.log('Successfully updated categories batch');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to update categories:', error);
      process.exit(1);
    });
}

export { updateFiveCategories };