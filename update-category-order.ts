import { db } from "./db";
import { questionCategories } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Updates the orderIndex values for all question categories to match the official documentation order
 */
async function updateCategoryOrder() {
  try {
    console.log("Starting category order update...");

    // Define categories in the exact order from the official SWAT Tier Level Assessment Template
    const categoryOrder = [
      { name: "Tier 1-4 Metrics (Personnel & Leadership)", order: 1 },
      { name: "Mission Profiles", order: 2 },
      { name: "Individual Operator Equipment", order: 3 },
      { name: "Sniper Equipment & Operations", order: 4 },
      { name: "Training", order: 5 },
      { name: "Selection & Training of Personnel", order: 6 },
      { name: "Tactical Emergency Medical Support (TEMS)", order: 7 },
      { name: "Breaching Operations", order: 8 },
      { name: "Less-Lethal Capabilities", order: 9 },
      { name: "Chemical Munitions", order: 10 },
      { name: "Noise Flash Diversionary Devices (NFDDs)", order: 11 },
      { name: "SCBA & HAZMAT Capabilities", order: 12 },
      { name: "K9 Operations & Integration", order: 13 },
      { name: "Explosive Ordnance Disposal (EOD) Support", order: 14 },
      { name: "Mobility, Transportation & Armor Support", order: 15 },
      { name: "Access & Elevated Tactics", order: 16 },
      { name: "Unique Environment & Technical Capabilities", order: 17 },
      { name: "Policy/SOP", order: 18 }
    ];
    
    // Get all categories from the database
    const existingCategories = await db.select().from(questionCategories);
    
    // Update each category order
    for (const category of categoryOrder) {
      const found = existingCategories.find(c => c.name === category.name);
      
      if (found) {
        await db.update(questionCategories)
          .set({ orderIndex: category.order })
          .where(eq(questionCategories.id, found.id));
        
        console.log(`Updated order for: ${category.name} to position ${category.order}`);
      } else {
        console.log(`Warning: Category not found: ${category.name}`);
      }
    }

    console.log("Category order update completed successfully!");
  } catch (error) {
    console.error("Error during category order update:", error);
    throw error;
  }
}

// Run the function
updateCategoryOrder()
  .then(() => {
    console.log("Category order update successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Category order update failed:", error);
    process.exit(1);
  });