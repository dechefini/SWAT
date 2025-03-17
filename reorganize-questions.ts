import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';

async function reorganizeQuestions() {
  console.log('Reorganizing SWAT assessment questions to match documents...');

  try {
    // First, create a mapping of the old categories to ensure we can find them
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Determine which categories we need to update or create
    
    // STEP 1: Create or update Tier Level Assessment Categories
    const tierLevelCategories = [
      { name: '1. Personnel & Leadership', description: 'Tier metrics for team personnel and leadership structure', orderIndex: 1 },
      { name: '2. Mission Profiles', description: 'Tier metrics for mission capabilities and training', orderIndex: 2 },
      { name: '3. Individual Operator Equipment', description: 'Tier metrics for personnel equipment', orderIndex: 3 },
      { name: '4. Sniper Equipment & Operations', description: 'Tier metrics for sniper capabilities', orderIndex: 4 },
      { name: '5. Breaching Operations', description: 'Tier metrics for breaching capabilities', orderIndex: 5 },
      { name: '6. Access & Elevated Tactics', description: 'Tier metrics for access capabilities', orderIndex: 6 },
      { name: '7. Less-Lethal Capabilities', description: 'Tier metrics for less-lethal systems', orderIndex: 7 },
      { name: '8. Noise Flash Diversionary Devices (NFDDs)', description: 'Tier metrics for NFDD capabilities', orderIndex: 8 },
      { name: '9. Chemical Munitions', description: 'Tier metrics for chemical munitions', orderIndex: 9 },
      { name: '10. K9 Operations & Integration', description: 'Tier metrics for K9 capabilities', orderIndex: 10 },
      { name: '11. Explosive Ordnance Disposal (EOD) Support', description: 'Tier metrics for EOD support', orderIndex: 11 },
      { name: '12. Mobility, Transportation & Armor Support', description: 'Tier metrics for vehicles and transportation', orderIndex: 12 },
      { name: '13. Command & Control Systems', description: 'Tier metrics for command systems', orderIndex: 13 },
      { name: '14. Surveillance & Intelligence', description: 'Tier metrics for surveillance capabilities', orderIndex: 14 },
      { name: '15. Tactical Medical Support', description: 'Tier metrics for medical capabilities', orderIndex: 15 },
      { name: '16. Video & Photography', description: 'Tier metrics for documentation systems', orderIndex: 16 },
      { name: '17. SCBA & HAZMAT Equipment', description: 'Tier metrics for HAZMAT operations', orderIndex: 17 },
    ];

    // STEP 2: Create or update Gap Analysis Categories
    const gapAnalysisCategories = [
      { name: 'Team Structure and Chain of Command', description: 'Assessment of team organization and command structure', orderIndex: 18 },
      { name: 'Supervisor-to-Operator Ratio', description: 'Assessment of supervision and span of control', orderIndex: 19 },
      { name: 'Span of Control Adjustments for Complex Operations', description: 'Assessment of operational control during complex missions', orderIndex: 20 },
      { name: 'Training and Evaluation of Leadership', description: 'Assessment of leadership development and training', orderIndex: 21 },
      { name: 'Equipment Procurement and Allocation', description: 'Assessment of equipment acquisition processes', orderIndex: 22 },
      { name: 'Equipment Maintenance and Inspection', description: 'Assessment of equipment maintenance protocols', orderIndex: 23 },
      { name: 'Equipment Inventory Management', description: 'Assessment of inventory tracking and management', orderIndex: 24 },
      { name: 'Standard Operating Guidelines (SOGs)', description: 'Assessment of policies and procedures', orderIndex: 25 },
    ];

    // STEP 3: Check, update or create categories
    const allNewCategories = [...tierLevelCategories, ...gapAnalysisCategories];
    
    for (const category of allNewCategories) {
      // Check if the category exists
      const existingCategory = await db.select().from(questionCategories).where(eq(questionCategories.name, category.name));
      
      if (existingCategory.length === 0) {
        // Category doesn't exist, create it
        const newId = randomUUID();
        await db.insert(questionCategories).values({
          id: newId,
          name: category.name,
          description: category.description,
          orderIndex: category.orderIndex
        });
        console.log(`Created new category: ${category.name}`);
        categoryMap.set(category.name, newId);
      } else {
        // Category exists, update it
        await db.update(questionCategories)
          .set({
            description: category.description,
            orderIndex: category.orderIndex
          })
          .where(eq(questionCategories.id, existingCategory[0].id));
        console.log(`Updated category: ${category.name}`);
      }
    }

    // Refresh the category map after updates
    const updatedCategories = await db.select().from(questionCategories);
    categoryMap.clear();
    updatedCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    console.log('Categories reorganized successfully');
    console.log('Next step: Run add-tier-questions.ts, add-tier-questions-part2.ts, add-tier-questions-part3.ts, add-gap-analysis-questions.ts, add-gap-analysis-questions-part2.ts, and add-gap-analysis-questions-part3.ts to update questions');
    
  } catch (error) {
    console.error('Error reorganizing questions:', error);
  }
}

// Execute the function
reorganizeQuestions();