import { db } from "./db";
import { questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * This script directly updates the second batch of questions in the database with efficient batching
 */
async function directUpdateQuestionsBatch2() {
  try {
    console.log("Starting direct question update batch 2...");

    // Define template questions by category - using correct IDs from the database
    const templateCategories = [
      {
        categoryName: "TEMS",
        categoryId: "74b73cd8-b277-485f-b5c7-d84ee4ff2a26", // Tactical Emergency Medical Support (TEMS)
        questions: [
          "Do you have dedicated TEMS personnel for operations?",
          "Do your TEMS providers have tactical training?",
          "Do you integrate TEMS into operational planning?",
          "Do you have enhanced medical equipment available for operations?",
          "Do you conduct casualty evacuation training and planning?"
        ]
      },
      {
        categoryName: "Breaching Operations",
        categoryId: "9420533e-af40-478c-8b8e-65b08e1f31ab",
        questions: [
          "Do you have dedicated breaching personnel?",
          "Do you have mechanical breaching capabilities?",
          "Do you have ballistic breaching capabilities?",
          "Do you have explosive breaching capabilities?",
          "Do you conduct regular breaching training and certification?"
        ]
      },
      {
        categoryName: "Less-Lethal Capabilities",
        categoryId: "7697e444-532a-4515-a8d5-a16cd428b4e0",
        questions: [
          "Do you have impact projectile systems?",
          "Do you have conducted energy weapons?",
          "Do you have specialized less-lethal launchers?",
          "Do you train all operators in less-lethal deployment?",
          "Do you have policies governing less-lethal use and deployment?"
        ]
      },
      {
        categoryName: "Chemical Munitions",
        categoryId: "c1191dc6-01ad-4af4-93fa-a99ac7f0350e",
        questions: [
          "Do you have CS/OC delivery systems?",
          "Do you have multiple deployment methods for chemical agents?",
          "Do you train all operators in chemical agent deployment?",
          "Do you have gas mask confidence training?",
          "Do you have policies governing chemical agent use and deployment?"
        ]
      },
      {
        categoryName: "Training",
        categoryId: "1e42dbb7-2d7c-47ee-9d27-df9352a7e3b6",
        questions: [
          "Do you conduct at least 192+ hours of team training annually?",
          "Do you conduct at least 144-191 hours of team training annually?",
          "Do you conduct at least 96-143 hours of team training annually?",
          "Do you conduct at least 48-95 hours of team training annually?",
          "Do you conduct training in entry tactics and room clearing procedures?",
          "Do you conduct training in tactical movement and formations?",
          "Do you conduct training in less-lethal and chemical munitions deployment?",
          "Do you conduct training in breaching techniques (mechanical, ballistic)?",
          "Do you conduct training in explosive breaching?",
          "Do you conduct training in tactical firearms and weapon handling?",
          "Do you conduct training in tactical planning and briefing?",
          "Do you conduct training in vehicle assaults and operations?",
          "Do you conduct training in rural/woodland operations?",
          "Do you conduct training in scenario-based exercises and simulations?",
          "Do you conduct training in tactical emergency medical support (TEMS) integration?"
        ]
      },
      {
        categoryName: "Selection & Training of Personnel",
        categoryId: "9c0a2402-b9d6-4ad4-9f13-b8fdc0b49644",
        questions: [
          "Do you have a formal selection process for team members?",
          "Do you require minimum years of law enforcement experience?",
          "Do you conduct physical fitness testing as part of selection?",
          "Do you conduct firearms proficiency testing as part of selection?",
          "Do you conduct psychological evaluation as part of selection?",
          "Do you have a probationary period for new team members?",
          "Do you have a formal basic SWAT operator course requirement?",
          "Do you have ongoing training requirements for all operators?",
          "Do you have specialized training for specific positions (sniper, etc.)?",
          "Do you have regular performance evaluations for team members?"
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

    console.log("Direct question update batch 2 completed successfully!");
  } catch (error) {
    console.error("Error during direct question update batch 2:", error);
    throw error;
  }
}

// Run the function
directUpdateQuestionsBatch2()
  .then(() => {
    console.log("Direct update batch 2 successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Direct update batch 2 failed:", error);
    process.exit(1);
  });