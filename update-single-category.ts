import { db } from './db';
import { questionCategories } from '@shared/schema';
import { updateQuestionsForCategory } from './update-questions-single-category';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

/**
 * Updates a single category by name or index
 */
async function updateSingleCategory(identifier: string | number) {
  console.log(`Starting update for category: ${identifier}`);

  try {
    let category;
    
    if (typeof identifier === 'number') {
      // Find by order index
      const categories = await db.select()
        .from(questionCategories)
        .where(eq(questionCategories.orderIndex, identifier));
      
      if (categories.length === 0) {
        throw new Error(`No category found with order index: ${identifier}`);
      }
      
      category = categories[0];
    } else {
      // Find by name (exact match)
      const categories = await db.select()
        .from(questionCategories)
        .where(eq(questionCategories.name, identifier));
      
      if (categories.length === 0) {
        throw new Error(`No category found with name: ${identifier}`);
      }
      
      category = categories[0];
    }

    console.log(`Processing category ${category.orderIndex}: ${category.name}`);
    await updateQuestionsForCategory(category.id);
    console.log(`Completed category ${category.orderIndex}: ${category.name}`);
    
    return category;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

// For running script directly via command line
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  // Get category identifier from command line
  const identifier = process.argv[2];
  
  if (!identifier) {
    console.error('Please provide a category name or order index');
    process.exit(1);
  }
  
  // Convert to number if possible
  const categoryIdentifier = isNaN(Number(identifier)) ? identifier : Number(identifier);
  
  updateSingleCategory(categoryIdentifier)
    .then((category) => {
      console.log(`Successfully updated category: ${category.name}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to update category:', error);
      process.exit(1);
    });
}

export { updateSingleCategory };