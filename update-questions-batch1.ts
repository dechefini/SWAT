import { db } from "./db";
import { questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * Updates questions from batch 1 of categories to match the official SWAT Tier Level Assessment Template
 */
async function updateQuestionsBatch1() {
  try {
    console.log("Starting to update questions batch 1...");

    // Define template questions by category
    const templateCategories = [
      {
        categoryName: "Tier 1-4 Metrics (Personnel & Leadership)",
        categoryId: "c1411a75-599f-49cf-a8b2-65e17db5f9ba",
        questions: [
          {
            text: "Do you have 34 or more total members on your team?",
            description: "Tier 1 requires 34+ operators",
            questionType: "boolean"
          },
          {
            text: "Do you have 26-33 total members on your team?",
            description: "Tier 2 requires 26-33 operators",
            questionType: "boolean"
          },
          {
            text: "Do you have 18-25 total members on your team?",
            description: "Tier 3 requires 18-25 operators",
            questionType: "boolean"
          },
          {
            text: "Do you have 10-17 total members on your team?",
            description: "Tier 4 requires 10-17 operators",
            questionType: "boolean"
          },
          {
            text: "Does your team operate in three or more shifts?",
            description: "Tier 1 requires 3+ shifts",
            questionType: "boolean"
          },
          {
            text: "Does your team operate in two shifts?",
            description: "Tier 2 requires 2 shifts",
            questionType: "boolean"
          },
          {
            text: "Does your team operate in a single shift?",
            description: "Tier 3-4 typically operate in 1 shift",
            questionType: "boolean"
          },
          {
            text: "Do you have an assigned team commander?",
            description: "Required for all tiers",
            questionType: "boolean"
          },
          {
            text: "Do you have an assigned executive officer (XO)?",
            description: "Required for Tier 1-2",
            questionType: "boolean"
          },
          {
            text: "Do you have an assigned team leader?",
            description: "Required for all tiers",
            questionType: "boolean"
          },
          {
            text: "Do you have an assigned assistant team leader?",
            description: "Required for all tiers",
            questionType: "boolean"
          },
          {
            text: "Do you have multiple dedicated element leaders?",
            description: "Required for Tier 1-2",
            questionType: "boolean"
          },
          {
            text: "Do you have a sniper element leader?",
            description: "Required for Tier 1",
            questionType: "boolean"
          },
          {
            text: "Do you have a chemical agent/less lethal element leader?",
            description: "Required for Tier 1-2",
            questionType: "boolean"
          },
          {
            text: "Do you have a negotiations element coordinator?",
            description: "Required for Tier 1-2",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Mission Profiles",
        categoryId: "3f137fcf-33c0-4d97-a4a4-7db2c28fc1c8",
        questions: [
          {
            text: "Do you maintain capability for high-risk warrant service operations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you maintain capability for armed barricaded subject (ABS) operations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you maintain capability for hostage rescue operations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you maintain capability for complex coordinated attacks such as those involving active shooters?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you maintain capability for counter-sniper operations?",
            description: "Tier 1-2 require this capability",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Individual Operator Equipment",
        categoryId: "dbb503ba-0683-49a5-8de7-03f4603773b6",
        questions: [
          {
            text: "Is each operator equipped with a primary handgun?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with a primary carbine/rifle?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with a tactical body armor (level IIIA minimum)?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with a ballistic helmet?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with eye protection?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with hearing protection?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with standard load-bearing equipment (LBE) or tactical vest?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with tactical communications equipment?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with a gas mask?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with a flashlight?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Is each operator equipped with a uniform or identifier apparel?",
            description: "Required for all tier levels",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Sniper Equipment/Operations",
        categoryId: "0b9d8bf2-ffd7-4b5a-b240-41c0456a8b1c",
        questions: [
          {
            text: "Do you have dedicated precision rifle platforms for snipers?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have dedicated spotting scopes for sniper operations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have range finding equipment for sniper operations?",
            description: "Tier 1-2 require this capability",
            questionType: "boolean"
          },
          {
            text: "Do you have environmental data gathering equipment (wind meters, etc.) for sniper operations?",
            description: "Tier 1-2 require this capability",
            questionType: "boolean"
          },
          {
            text: "Do you have night vision capability for sniper operations?",
            description: "Tier 1-2 require this capability",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Team Equipment",
        categoryId: "afcd4ec5-daad-4f53-b52e-bfa2ae9b2241",
        questions: [
          {
            text: "Do you have dedicated breaching equipment (mechanical, ballistic, and/or explosive)?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have chemical agents and delivery systems?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have less-lethal capability and delivery systems?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have distraction devices (flash-bangs)?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have dedicated tactical vehicles?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have ballistic shields?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have tactical lighting systems?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have search mirrors?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have throw phones or other negotiation equipment?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have tactical medical equipment (beyond individual IFAK)?",
            description: "Required for all tier levels",
            questionType: "boolean"
          }
        ]
      }
    ];

    // Process each category
    for (const template of templateCategories) {
      const categoryId = template.categoryId;
      
      if (!categoryId) {
        console.log(`No category ID found for ${template.categoryName}, skipping...`);
        continue;
      }
      
      console.log(`Processing category: ${template.categoryName} (ID: ${categoryId})`);
      
      // First, get existing questions for this category
      const existingQuestions = await db.select().from(questions).where(eq(questions.categoryId, categoryId));
      console.log(`Found ${existingQuestions.length} existing questions for this category`);
      
      // Create a mapping of existing question IDs that we want to preserve
      // We'll use text similarity to determine which questions to keep
      const questionIdMap = new Map<string, string>(); // Maps template text to existing question ID
      
      // Map existing questions to template questions based on similarity
      for (const eq of existingQuestions) {
        for (const tq of template.questions) {
          // Check if texts are similar
          if (
            eq.text.toLowerCase().includes(tq.text.toLowerCase().substring(0, 25)) || 
            tq.text.toLowerCase().includes(eq.text.toLowerCase().substring(0, 25))
          ) {
            questionIdMap.set(tq.text, eq.id);
            break;
          }
        }
      }
      
      // Delete existing questions for this category to prevent duplicates
      await db.delete(questions).where(eq(questions.categoryId, categoryId));
      console.log(`Deleted existing questions for category: ${template.categoryName}`);
      
      // Add the template questions for this category with preserved IDs where possible
      for (let i = 0; i < template.questions.length; i++) {
        const q = template.questions[i];
        const existingId = questionIdMap.get(q.text);
        const questionId = existingId || uuid();
        
        // Use a raw SQL insert to include the ID field
        await db.execute(sql`
          INSERT INTO questions (
            id, text, description, category_id, 
            order_index, question_type, created_at
          ) VALUES (
            ${questionId},
            ${q.text},
            ${q.description},
            ${categoryId},
            ${i + 1},
            ${q.questionType || 'boolean'},
            ${new Date()}
          )
        `);
      }
      
      console.log(`Added ${template.questions.length} template questions for category: ${template.categoryName}`);
    }

    console.log('Completed updating questions for batch 1.');
  } catch (error) {
    console.error('Error updating questions:', error);
    throw error;
  }
}

// Run the function
updateQuestionsBatch1()
  .then(() => {
    console.log('Questions batch 1 successfully updated!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update questions batch 1:', error);
    process.exit(1);
  });