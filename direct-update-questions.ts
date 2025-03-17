import { db } from "./db";
import { questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * This script directly updates questions in the database with more efficient batching
 */
async function directUpdateQuestions() {
  try {
    console.log("Starting direct question update...");

    // Define all template questions by category - using the accurate category IDs from the database
    const templateCategories = [
      {
        categoryName: "Tier 1-4 Metrics (Personnel & Leadership)",
        categoryId: "c1411a75-599f-49cf-a8b2-65e17db5f9ba",
        questions: [
          "Do you have 34 or more total members on your team?",
          "Do you have 26-33 total members on your team?",
          "Do you have 18-25 total members on your team?",
          "Do you have 10-17 total members on your team?",
          "Does your team operate in three or more shifts?",
          "Does your team operate in two shifts?",
          "Does your team operate in a single shift?",
          "Do you have an assigned team commander?",
          "Do you have an assigned executive officer (XO)?",
          "Do you have an assigned team leader?",
          "Do you have an assigned assistant team leader?",
          "Do you have multiple dedicated element leaders?",
          "Do you have a sniper element leader?",
          "Do you have a chemical agent/less lethal element leader?",
          "Do you have a negotiations element coordinator?"
        ]
      },
      {
        categoryName: "Mission Profiles",
        categoryId: "3f137fcf-33c0-4d97-a4a4-7db2c28fc1c8",
        questions: [
          "Do you maintain capability for high-risk warrant service operations?",
          "Do you maintain capability for armed barricaded subject (ABS) operations?",
          "Do you maintain capability for hostage rescue operations?",
          "Do you maintain capability for complex coordinated attacks such as those involving active shooters?",
          "Do you maintain capability for counter-sniper operations?"
        ]
      },
      {
        categoryName: "Individual Operator Equipment",
        categoryId: "dbb503ba-0683-49a5-8de7-03f4603773b6",
        questions: [
          "Is each operator equipped with a primary handgun?",
          "Is each operator equipped with a primary carbine/rifle?",
          "Is each operator equipped with a tactical body armor (level IIIA minimum)?",
          "Is each operator equipped with a ballistic helmet?",
          "Is each operator equipped with eye protection?",
          "Is each operator equipped with hearing protection?",
          "Is each operator equipped with standard load-bearing equipment (LBE) or tactical vest?",
          "Is each operator equipped with tactical communications equipment?",
          "Is each operator equipped with a gas mask?",
          "Is each operator equipped with a flashlight?",
          "Is each operator equipped with a uniform or identifier apparel?"
        ]
      },
      {
        categoryName: "Sniper Equipment & Operations",
        categoryId: "f3f0d9c4-d9fd-42e0-8df8-94e5bf93a1e5", // Corrected ID from database
        questions: [
          "Do you have dedicated precision rifle platforms for snipers?",
          "Do you have dedicated spotting scopes for sniper operations?",
          "Do you have range finding equipment for sniper operations?",
          "Do you have environmental data gathering equipment (wind meters, etc.) for sniper operations?",
          "Do you have night vision capability for sniper operations?"
        ]
      }
    ];
    
    // For each category, update questions in bulk
    for (const category of templateCategories) {
      console.log(`Processing category: ${category.categoryName}`);
      
      // First, delete existing questions
      await db.delete(questions).where(eq(questions.categoryId, category.categoryId));
      console.log(`Deleted existing questions for ${category.categoryName}`);
      
      // Now, let's insert the new questions in one SQL query
      // Build the values for the multi-insert query
      const values = category.questions.map((questionText, index) => {
        return `('${uuid()}', '${questionText.replace(/'/g, "''")}', 'Required for tiering', '${category.categoryId}', ${index + 1}, 'boolean', '${new Date().toISOString()}')`;
      }).join(', ');
      
      if (values.length > 0) {
        await db.execute(sql`
          INSERT INTO questions (id, text, description, category_id, order_index, question_type, created_at)
          VALUES ${sql.raw(values)}
        `);
        
        console.log(`Added ${category.questions.length} questions to ${category.categoryName}`);
      }
    }

    console.log("Direct question update completed successfully!");
  } catch (error) {
    console.error("Error during direct question update:", error);
    throw error;
  }
}

// Run the function
directUpdateQuestions()
  .then(() => {
    console.log("Direct update successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Direct update failed:", error);
    process.exit(1);
  });