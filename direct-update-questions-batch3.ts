import { db } from "./db";
import { questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * This script directly updates the third batch of questions in the database with efficient batching
 */
async function directUpdateQuestionsBatch3() {
  try {
    console.log("Starting direct question update batch 3...");

    // Define template questions by category
    const templateCategories = [
      {
        categoryName: "Noise Flash Diversionary Devices (NFDDs)",
        categoryId: "a65cd14e-69a8-4acc-8f46-7c6b169c9a62",
        questions: [
          "Do you have NFDDs available for operations?",
          "Do you have dedicated personnel trained in NFDD deployment?",
          "Do you conduct regular training in NFDD deployment?",
          "Do you have policies governing NFDD use and deployment?",
          "Do you have documentation of NFDD inventory and deployment?"
        ]
      },
      {
        categoryName: "SCBA & HAZMAT Capabilities",
        categoryId: "c8d87078-a85b-4f20-b681-d26223ff2ca8",
        questions: [
          "Do you have SCBA equipment available for operations?",
          "Do all operators receive SCBA training?",
          "Do you conduct regular SCBA confidence and use training?",
          "Do you have policies for SCBA deployment and use?",
          "Do you have HAZMAT identification and response capabilities?"
        ]
      },
      {
        categoryName: "K9 Operations & Integration",
        categoryId: "8e0106b2-9608-4ac0-b68a-bcf0bdbc31e5",
        questions: [
          "Do you have dedicated tactical K9 teams?",
          "Do your K9 handlers receive tactical team training?",
          "Do you integrate K9 into tactical planning?",
          "Do you conduct training for K9 integration with tactical operations?",
          "Do you have policies governing K9 use in tactical operations?"
        ]
      },
      {
        categoryName: "Explosive Ordnance Disposal (EOD) Support",
        categoryId: "f7efe965-38ce-458a-b6b0-508d6dd53cbf",
        questions: [
          "Do you have dedicated EOD support?",
          "Do your EOD technicians receive tactical team training?",
          "Do you integrate EOD into tactical planning?",
          "Do you conduct training for EOD integration with tactical operations?",
          "Do you have policies governing EOD integration in tactical operations?"
        ]
      },
      {
        categoryName: "Mobility, Transportation & Armor Support",
        categoryId: "1fed3322-7f4f-4a66-828e-c5f7bedd3008",
        questions: [
          "Do you have armored tactical vehicles?",
          "Do you have specialized transportation for tactical operations?",
          "Do you have a mobile command post?",
          "Do you have armored ballistic shields (Level III+)?",
          "Do you have specialized mobility equipment for tactical operations?"
        ]
      },
      {
        categoryName: "Access & Elevated Tactics",
        categoryId: "1597467a-612f-437a-9de7-e86f9529cf6f",
        questions: [
          "Do you have specialized equipment for elevated entry?",
          "Do you have rappelling equipment and capability?",
          "Do you have training in helicopter insertion tactics?",
          "Do you train in elevated shooting platforms?",
          "Do you have policies governing operations in elevated environments?"
        ]
      },
      {
        categoryName: "Unique Environment & Technical Capabilities",
        categoryId: "0d05ec4d-902f-4582-bf92-aae31017a4e6",
        questions: [
          "Do you have underwater/maritime tactical capability?",
          "Do you have low-light/no-light operational capabilities?",
          "Do you have rural/woodland operational capabilities?",
          "Do you have tubular assault capabilities (aircraft, buses, trains)?",
          "Do you have thermal/infrared detection capabilities?",
          "Do you have drone/UAS capabilities?",
          "Do you have throw phone or remote communications capabilities?",
          "Do you have robot/remote reconnaissance capabilities?",
          "Do you have cellular intelligence capabilities?",
          "Do you have technical surveillance capabilities?"
        ]
      },
      {
        categoryName: "Policy/SOP",
        categoryId: "a7d2b91c-b5d0-4b16-9552-eab1e877c2cc",
        questions: [
          "Do you have written policies for team activations?",
          "Do you have written policies for use of force?",
          "Do you have written policies for hostage negotiation integration?",
          "Do you have written policies for equipment deployment?",
          "Do you have written policies for after-action reviews?",
          "Do you have written policies for documentation of operations?",
          "Do you have written policies for mutual aid deployment?",
          "Do you have written policies for training requirements?",
          "Do you have written policies for selection of personnel?",
          "Do you have written policies for critical incident management?"
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

    console.log("Direct question update batch 3 completed successfully!");
  } catch (error) {
    console.error("Error during direct question update batch 3:", error);
    throw error;
  }
}

// Run the function
directUpdateQuestionsBatch3()
  .then(() => {
    console.log("Direct update batch 3 successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Direct update batch 3 failed:", error);
    process.exit(1);
  });