import { db } from "./db";
import { questionCategories, questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * Updates the question categories to exactly match the official SWAT Tier Level Assessment Template
 * Organizes categories in the exact order required by the official document
 */
async function updateCategoriesExactOrder() {
  try {
    console.log("Starting category reorganization to match official template...");

    // Define the 15 official categories with their display order
    const officialCategories = [
      { name: "Tier 1-4 Metrics (Personnel & Leadership)", description: "Personnel requirements and leadership structure for SWAT team tiering assessment", orderIndex: 1 },
      { name: "Mission Profiles", description: "Operational mission capabilities and readiness assessment", orderIndex: 2 },
      { name: "Individual Operator Equipment", description: "Assessment of individual operator equipment and gear", orderIndex: 3 },
      { name: "Sniper Equipment & Operations", description: "Assessment of sniper team capabilities, equipment, and training", orderIndex: 4 },
      { name: "Breaching Operations", description: "Assessment of team breaching capabilities and equipment", orderIndex: 5 },
      { name: "Access & Elevated Tactics", description: "Assessment of team capabilities for accessing elevated positions and structures", orderIndex: 6 },
      { name: "Less-Lethal Capabilities", description: "Assessment of team less-lethal options and deployment capabilities", orderIndex: 7 },
      { name: "Noise Flash Diversionary Devices (NFDDs)", description: "Assessment of NFDD capabilities and training", orderIndex: 8 },
      { name: "Chemical Munitions", description: "Assessment of chemical munitions capabilities and training", orderIndex: 9 },
      { name: "K9 Operations & Integration", description: "Assessment of K9 integration with tactical operations", orderIndex: 10 },
      { name: "Explosive Ordnance Disposal (EOD) Support", description: "Assessment of EOD integration with tactical operations", orderIndex: 11 },
      { name: "Mobility, Transportation & Armor Support", description: "Assessment of tactical mobility and transportation capabilities", orderIndex: 12 },
      { name: "Unique Environment & Technical Capabilities", description: "Assessment of specialized environments and technical capabilities", orderIndex: 13 },
      { name: "SCBA & HAZMAT Capabilities", description: "Assessment of respiratory protection and hazardous materials capabilities", orderIndex: 14 },
      { name: "Tactical Emergency Medical Support (TEMS)", description: "Assessment of tactical medical support integration", orderIndex: 15 }
    ];
    
    // Get all existing categories
    const existingCategories = await db.select().from(questionCategories);
    console.log(`Found ${existingCategories.length} existing categories`);
    
    // Create a mapping from old categories to official categories
    // This allows us to preserve existing category IDs where possible
    const categoryMapping: Record<string, { id: string, name: string }> = {};
    
    // Find existing category IDs that match our official categories (case insensitive matching)
    for (const officialCategory of officialCategories) {
      const existingCategory = existingCategories.find(
        c => c.name.toLowerCase() === officialCategory.name.toLowerCase() || 
             c.name.toLowerCase().includes(officialCategory.name.toLowerCase()) ||
             officialCategory.name.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (existingCategory) {
        categoryMapping[officialCategory.name] = { 
          id: existingCategory.id,
          name: existingCategory.name
        };
        console.log(`Mapped "${officialCategory.name}" to existing category "${existingCategory.name}" (${existingCategory.id})`);
      }
    }
    
    // For any official categories that don't have a match, create new ones
    for (const officialCategory of officialCategories) {
      if (!categoryMapping[officialCategory.name]) {
        const newId = uuid();
        categoryMapping[officialCategory.name] = { 
          id: newId,
          name: officialCategory.name
        };
        console.log(`Created new mapping for "${officialCategory.name}" with ID ${newId}`);
      }
    }
    
    console.log("Category mapping complete. Updating database...");
    
    // Update existing categories and create new ones as needed
    for (const officialCategory of officialCategories) {
      const mappedCategory = categoryMapping[officialCategory.name];
      
      // Check if this ID already exists in the database
      const existingCategory = existingCategories.find(c => c.id === mappedCategory.id);
      
      if (existingCategory) {
        // Update existing category to match official name and order
        await db.update(questionCategories)
          .set({ 
            name: officialCategory.name,
            description: officialCategory.description,
            orderIndex: officialCategory.orderIndex
          })
          .where(eq(questionCategories.id, mappedCategory.id));
        
        console.log(`Updated existing category: ${existingCategory.name} → ${officialCategory.name}`);
      } else {
        // Create new category with the generated ID
        await db.insert(questionCategories).values({
          id: mappedCategory.id,
          name: officialCategory.name,
          description: officialCategory.description,
          orderIndex: officialCategory.orderIndex,
          createdAt: new Date()
        });
        
        console.log(`Created new category: ${officialCategory.name}`);
      }
    }
    
    // Delete categories that aren't in the official list
    // First, get all categories that aren't in our mapping
    const categoriesToDelete = existingCategories.filter(
      c => !Object.values(categoryMapping).some(m => m.id === c.id)
    );
    
    // Delete each non-official category
    for (const categoryToDelete of categoriesToDelete) {
      // Before deleting, move questions to their proper category if needed
      const categoryQuestions = await db.select().from(questions)
        .where(eq(questions.categoryId, categoryToDelete.id));
      
      console.log(`Found ${categoryQuestions.length} questions in category "${categoryToDelete.name}" that need migration`);
      
      // Determine where to move questions based on category name hints
      // (We'd need a more sophisticated mapping system for production)
      let targetCategoryId = null;
      
      if (categoryToDelete.name.toLowerCase().includes('train')) {
        targetCategoryId = categoryMapping["Tactical Emergency Medical Support (TEMS)"].id;
        console.log(`Moving questions from "${categoryToDelete.name}" to "Tactical Emergency Medical Support (TEMS)"`);
      } else if (categoryToDelete.name.toLowerCase().includes('selection')) {
        targetCategoryId = categoryMapping["Tier 1-4 Metrics (Personnel & Leadership)"].id;
        console.log(`Moving questions from "${categoryToDelete.name}" to "Tier 1-4 Metrics (Personnel & Leadership)"`);
      } else if (categoryToDelete.name.toLowerCase().includes('policy') || categoryToDelete.name.toLowerCase().includes('sop')) {
        targetCategoryId = categoryMapping["Unique Environment & Technical Capabilities"].id;
        console.log(`Moving questions from "${categoryToDelete.name}" to "Unique Environment & Technical Capabilities"`);
      }
      
      // If we found a target category, move the questions
      if (targetCategoryId && categoryQuestions.length > 0) {
        await db.update(questions)
          .set({ categoryId: targetCategoryId })
          .where(eq(questions.categoryId, categoryToDelete.id));
        
        console.log(`Moved ${categoryQuestions.length} questions to new category`);
      }
      
      // Now delete the category
      await db.delete(questionCategories).where(eq(questionCategories.id, categoryToDelete.id));
      console.log(`Deleted non-official category: ${categoryToDelete.name}`);
    }
    
    console.log("Category reorganization completed successfully!");
  } catch (error) {
    console.error("Error during category reorganization:", error);
    throw error;
  }
}

// Run the function
updateCategoriesExactOrder()
  .then(() => {
    console.log("Category update successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Category update failed:", error);
    process.exit(1);
  });