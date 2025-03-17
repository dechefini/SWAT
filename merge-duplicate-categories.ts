import { db } from './db';
import { sql } from 'drizzle-orm';
import { questionCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Merges duplicate categories by moving questions to the canonical category
 * and deleting the redundant categories
 */
async function mergeDuplicateCategories() {
  try {
    console.log('Starting to merge duplicate categories...');

    // Define the mapping of duplicate/similar categories to their canonical form
    const categoryMapping = [
      {
        canonical: { name: "Tier 1-4 Metrics (Personnel & Leadership)", index: 1 },
        duplicates: [
          "Personnel & Leadership",
          "Specialized Roles",
          "Command & Control Systems",
          "Supervisor-to-Operator Ratio",
          "Span of Control Adjustments for Complex Operations",
          "Training and Evaluation of Leadership",
          "Team Structure and Chain of Command"
        ]
      },
      {
        canonical: { name: "Mission Profiles", index: 2 },
        duplicates: [
          "Mission Capabilities & Training",
          "Standard Operating Guidelines (SOGs)"
        ]
      },
      {
        canonical: { name: "Individual Operator Equipment", index: 3 },
        duplicates: [
          "Equipment Procurement and Allocation",
          "Equipment Maintenance and Inspection",
          "Equipment Inventory Management"
        ]
      },
      {
        canonical: { name: "Breaching Operations", index: 5 },
        duplicates: [
          "Breaching Capabilities"
        ]
      },
      {
        canonical: { name: "Unique Environment & Technical Capabilities", index: 13 },
        duplicates: [
          "Surveillance & Intelligence",
          "Video & Photography"
        ]
      },
      {
        canonical: { name: "SCBA & HAZMAT Capabilities", index: 14 },
        duplicates: [
          "SCBA & HAZMAT Equipment"
        ]
      },
      {
        canonical: { name: "Tactical Emergency Medical Support (TEMS)", index: 15 },
        duplicates: [
          "Tactical Medical Support"
        ]
      }
    ];

    // Process each canonical category and its duplicates
    for (const mapping of categoryMapping) {
      console.log(`Processing canonical category: ${mapping.canonical.name}`);
      
      // Find the canonical category
      const canonicalCategories = await db.select().from(questionCategories)
        .where(eq(questionCategories.name, mapping.canonical.name));
      
      if (canonicalCategories.length === 0) {
        console.error(`Canonical category "${mapping.canonical.name}" not found!`);
        continue;
      }
      
      const canonicalCategoryId = canonicalCategories[0].id;
      
      // Process each duplicate
      for (const duplicateName of mapping.duplicates) {
        const duplicateCategories = await db.select().from(questionCategories)
          .where(eq(questionCategories.name, duplicateName));
        
        if (duplicateCategories.length === 0) {
          console.log(`Duplicate category "${duplicateName}" not found, skipping.`);
          continue;
        }
        
        for (const duplicateCategory of duplicateCategories) {
          console.log(`Moving questions from "${duplicateName}" to "${mapping.canonical.name}"`);
          
          // Move questions to canonical category
          await db.execute(sql`
            UPDATE questions
            SET "category_id" = ${canonicalCategoryId}
            WHERE "category_id" = ${duplicateCategory.id}
          `);
          
          // Delete the duplicate category
          await db.delete(questionCategories)
            .where(eq(questionCategories.id, duplicateCategory.id));
          
          console.log(`Deleted duplicate category "${duplicateName}"`);
        }
      }
    }

    console.log('Duplicate categories have been successfully merged.');
  } catch (error) {
    console.error('Error merging duplicate categories:', error);
  }
}

// Execute the function
mergeDuplicateCategories()
  .then(() => {
    console.log('Category merging completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Category merging failed:', error);
    process.exit(1);
  });

export default mergeDuplicateCategories;