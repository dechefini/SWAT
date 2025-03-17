import { db } from "./db";
import { questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * Updates questions for batch 2 of categories to match the official SWAT Tier Level Assessment Template
 */
async function updateQuestionsBatch2() {
  try {
    console.log("Starting to update questions batch 2...");

    // Define template questions by category
    const templateCategories = [
      {
        categoryName: "Specialized Capabilities",
        categoryId: "f21a40a2-45df-4c01-8f94-3f260b8e6c8f",
        questions: [
          {
            text: "Do you have night vision capability?",
            description: "Required for tier 1-2",
            questionType: "boolean"
          },
          {
            text: "Do you have thermal imaging capability?",
            description: "Required for tier 1",
            questionType: "boolean"
          },
          {
            text: "Do you have robot/remote systems capability?",
            description: "Required for tier 1",
            questionType: "boolean"
          },
          {
            text: "Do you have drone/UAS capability?",
            description: "Required for tier 1-2",
            questionType: "boolean"
          },
          {
            text: "Do you have armored vehicle capability?",
            description: "Required for tier 1",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Training",
        categoryId: "1e42dbb7-2d7c-47ee-9d27-df9352a7e3b6",
        questions: [
          {
            text: "Do you conduct at least 192+ hours of team training annually?",
            description: "Tier 1 requires 192+ hours annually",
            questionType: "boolean"
          },
          {
            text: "Do you conduct at least 144-191 hours of team training annually?",
            description: "Tier 2 requires 144-191 hours annually",
            questionType: "boolean"
          },
          {
            text: "Do you conduct at least 96-143 hours of team training annually?",
            description: "Tier 3 requires 96-143 hours annually",
            questionType: "boolean"
          },
          {
            text: "Do you conduct at least 48-95 hours of team training annually?",
            description: "Tier 4 requires 48-95 hours annually",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in entry tactics and room clearing procedures?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in tactical movement and formations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in less-lethal and chemical munitions deployment?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in breaching techniques (mechanical, ballistic)?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in explosive breaching?",
            description: "Required for tier 1",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in tactical firearms and weapon handling?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in tactical planning and briefing?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in vehicle assaults and operations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in rural/woodland operations?",
            description: "Required for tier 1-2",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in scenario-based exercises and simulations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct training in tactical emergency medical support (TEMS) integration?",
            description: "Required for tier 1-3",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Operational Planning & Intelligence",
        categoryId: "ba3b0be8-2608-436c-a5be-d85b9b1c27a2",
        questions: [
          {
            text: "Do you have standardized operational planning procedures?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have standardized briefing formats for operations?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have standardized intelligence collection procedures?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct pre-operational surveillance when appropriate?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you maintain a system for operational record-keeping and after-action reviews?",
            description: "Required for all tier levels",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Selection & Training of Personnel",
        categoryId: "9c0a2402-b9d6-4ad4-9f13-b8fdc0b49644",
        questions: [
          {
            text: "Do you have a formal selection process for team members?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you require minimum years of law enforcement experience?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct physical fitness testing as part of selection?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct firearms proficiency testing as part of selection?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you conduct psychological evaluation as part of selection?",
            description: "Required for tier 1-2",
            questionType: "boolean"
          },
          {
            text: "Do you have a probationary period for new team members?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have a formal basic SWAT operator course requirement?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have ongoing training requirements for all operators?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have specialized training for specific positions (sniper, etc.)?",
            description: "Required for all tier levels",
            questionType: "boolean"
          },
          {
            text: "Do you have regular performance evaluations for team members?",
            description: "Required for all tier levels",
            questionType: "boolean"
          }
        ]
      },
      {
        categoryName: "Tactical Emergency Medical Support (TEMS)",
        categoryId: "e61b1b8a-bd39-46d5-b9e9-3d76e22c31ca",
        questions: [
          {
            text: "Do you have dedicated TEMS personnel for operations?",
            description: "Required for tier 1-3",
            questionType: "boolean"
          },
          {
            text: "Do your TEMS providers have tactical training?",
            description: "Required for tier 1-3",
            questionType: "boolean"
          },
          {
            text: "Do you integrate TEMS into operational planning?",
            description: "Required for tier 1-3",
            questionType: "boolean"
          },
          {
            text: "Do you have enhanced medical equipment available for operations?",
            description: "Required for tier 1-3",
            questionType: "boolean"
          },
          {
            text: "Do you conduct casualty evacuation training and planning?",
            description: "Required for tier 1-3",
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

    console.log('Completed updating questions for batch 2.');
  } catch (error) {
    console.error('Error updating questions:', error);
    throw error;
  }
}

// Run the function
updateQuestionsBatch2()
  .then(() => {
    console.log('Questions batch 2 successfully updated!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update questions batch 2:', error);
    process.exit(1);
  });