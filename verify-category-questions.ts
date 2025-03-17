import { db } from './db';
import { questionCategories, questions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

/**
 * This script verifies that all categories have questions loaded
 * and reports statistics about each category's questions
 */
async function verifyCategoryQuestions() {
  console.log('Verifying categories and questions...');

  try {
    // Get all categories ordered by index
    const categories = await db.select()
      .from(questionCategories)
      .orderBy(questionCategories.orderIndex);

    console.log(`Found ${categories.length} categories`);
    
    // Target counts based on official template
    const targetCounts: Record<string, number> = {
      "Tier 1-4 Metrics (Personnel & Leadership)": 15,
      "Mission Profiles": 5,
      "Individual Operator Equipment": 10,
      "Sniper Equipment & Operations": 17,
      "Breaching Operations": 7,
      "Access & Elevated Tactics": 6,
      "Less-Lethal Capabilities": 6,
      "Noise Flash Diversionary Devices (NFDDs)": 4,
      "Chemical Munitions": 6,
      "K9 Operations & Integration": 6,
      "Explosive Ordnance Disposal (EOD) Support": 5,
      "Mobility, Transportation & Armor Support": 6,
      "Unique Environment & Technical Capabilities": 9,
      "SCBA & HAZMAT Capabilities": 6,
      "Tactical Emergency Medical Support (TEMS)": 5, 
      "Negotiations & Crisis Response": 3
    };
    
    // Track total questions
    let totalQuestions = 0;
    
    for (const category of categories) {
      // Get questions for this category
      const categoryQuestions = await db.select()
        .from(questions)
        .where(eq(questions.categoryId, category.id));
      
      // Get expected count
      const expectedCount = targetCounts[category.name] || 'unknown';
      const alignmentStatus = categoryQuestions.length === targetCounts[category.name] ? 
        '✓ ALIGNED' : '✗ MISALIGNED';
      
      console.log(`Category ${category.orderIndex}: ${category.name}`);
      console.log(`  Questions: ${categoryQuestions.length} (Expected: ${expectedCount}) - ${alignmentStatus}`);
      
      // Sample questions
      if (categoryQuestions.length > 0) {
        console.log('  Sample questions:');
        for (let i = 0; i < Math.min(3, categoryQuestions.length); i++) {
          console.log(`    ${i+1}. ${categoryQuestions[i].text}`);
        }
      } else {
        console.log('  WARNING: No questions found for this category');
      }
      
      console.log('');
      totalQuestions += categoryQuestions.length;
    }
    
    console.log('========== Summary ==========');
    console.log(`Total categories: ${categories.length}`);
    console.log(`Total questions: ${totalQuestions}`);
    console.log(`Expected questions per official template: 116`);
    
    if (totalQuestions === 116) {
      console.log('✓ ALIGNED: Question count matches official template');
    } else {
      console.log(`✗ MISALIGNED: Question count (${totalQuestions}) doesn't match official template (116)`);
    }
    
  } catch (error) {
    console.error('Error verifying categories:', error);
    throw error;
  }
}

// For running script directly via command line
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  verifyCategoryQuestions()
    .then(() => {
      console.log('Verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyCategoryQuestions };