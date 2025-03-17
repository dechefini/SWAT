import { db } from './db';
import { questionCategories } from '@shared/schema';
import { updateQuestionsForCategory } from './update-questions-single-category';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Updates all categories with questions in the database to match the official SWAT Tier Level Assessment Template
 */
async function updateAllCategoryQuestions() {
  console.log('Starting update of all category questions...');

  try {
    // First, make sure we have all 16 categories
    const categoriesData = [
      { name: 'Tier 1-4 Metrics (Personnel & Leadership)', orderIndex: 1 },
      { name: 'Mission Profiles', orderIndex: 2 },
      { name: 'Individual Operator Equipment', orderIndex: 3 },
      { name: 'Sniper Equipment & Operations', orderIndex: 4 },
      { name: 'Breaching Operations', orderIndex: 5 },
      { name: 'Access & Elevated Tactics', orderIndex: 6 },
      { name: 'Less-Lethal Capabilities', orderIndex: 7 },
      { name: 'Noise Flash Diversionary Devices (NFDDs)', orderIndex: 8 },
      { name: 'Chemical Munitions', orderIndex: 9 },
      { name: 'K9 Operations & Integration', orderIndex: 10 },
      { name: 'Explosive Ordnance Disposal (EOD) Support', orderIndex: 11 },
      { name: 'Mobility, Transportation & Armor Support', orderIndex: 12 },
      { name: 'Unique Environment & Technical Capabilities', orderIndex: 13 },
      { name: 'SCBA & HAZMAT Capabilities', orderIndex: 14 },
      { name: 'Tactical Emergency Medical Support (TEMS)', orderIndex: 15 },
      { name: 'Negotiations & Crisis Response', orderIndex: 16 },
    ];

    // Create missing categories
    for (const categoryData of categoriesData) {
      // Check if category exists
      const existingCategories = await db.select()
        .from(questionCategories)
        .where(eq(questionCategories.name, categoryData.name));

      if (existingCategories.length === 0) {
        // Create the category
        await db.insert(questionCategories)
          .values({
            name: categoryData.name,
            orderIndex: categoryData.orderIndex,
            description: `Official SWAT Tier Level Assessment category: ${categoryData.name}`
          });
        console.log(`Created missing category: ${categoryData.name}`);
      }
    }

    // Get all categories from the database
    const allCategories = await db.select().from(questionCategories).orderBy(questionCategories.orderIndex);
    
    // Process each category one by one
    for (const category of allCategories) {
      console.log(`Processing category ${category.orderIndex}: ${category.name}`);
      await updateQuestionsForCategory(category.id);
      console.log(`Completed category ${category.orderIndex}: ${category.name}`);
      
      // Add a small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('All categories updated successfully');
  } catch (error) {
    console.error('Error updating categories:', error);
    throw error;
  }
}

// For running script directly via command line
import { fileURLToPath } from 'url';

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  updateAllCategoryQuestions()
    .then(() => {
      console.log('Successfully updated all categories with template questions');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to update categories:', error);
      process.exit(1);
    });
}

export { updateAllCategoryQuestions };