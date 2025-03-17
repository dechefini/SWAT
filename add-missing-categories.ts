import { db } from "./db";
import { questionCategories } from "../shared/schema";
import { sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * This script adds the missing categories from the official SWAT Tier Level Assessment Template
 */
async function addMissingCategories() {
  try {
    console.log("Starting to add missing categories...");

    // Define missing categories with their display order
    const missingCategories = [
      { 
        id: "1e42dbb7-2d7c-47ee-9d27-df9352a7e3b6", 
        name: "Training", 
        description: "Assessment of team training frequency, quality, and curriculum coverage", 
        orderIndex: 5 
      },
      { 
        id: "9c0a2402-b9d6-4ad4-9f13-b8fdc0b49644", 
        name: "Selection & Training of Personnel", 
        description: "Assessment of personnel selection process and ongoing training requirements", 
        orderIndex: 6 
      },
      { 
        id: "a7d2b91c-b5d0-4b16-9552-eab1e877c2cc", 
        name: "Policy/SOP", 
        description: "Assessment of team policies and standard operating procedures", 
        orderIndex: 15 
      }
    ];
    
    // Insert each missing category
    for (const category of missingCategories) {
      // Use raw SQL to insert with a specific ID
      await db.execute(sql`
        INSERT INTO question_categories (id, name, description, order_index, created_at)
        VALUES (${category.id}, ${category.name}, ${category.description}, ${category.orderIndex}, ${new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE 
        SET name = ${category.name}, 
            description = ${category.description}, 
            order_index = ${category.orderIndex}
      `);
      
      console.log(`Added or updated category: ${category.name}`);
    }

    console.log("Missing categories added successfully!");
  } catch (error) {
    console.error("Error adding missing categories:", error);
    throw error;
  }
}

// Run the function
addMissingCategories()
  .then(() => {
    console.log("Categories update successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Categories update failed:", error);
    process.exit(1);
  });