import { db } from "./db";
import { questionCategories, questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * Updates the final batch of categories with the exact questions from the template
 */
async function updateTieringQuestionsPart3() {
  try {
    console.log("Starting to update questions batch 3...");

    // First, get all categories to have their IDs
    const categories = await db.select().from(questionCategories);
    console.log(`Found ${categories.length} categories in the database`);
    
    // Create a mapping of category names to their IDs for easier reference
    const categoryIdMap: Record<string, string> = {};
    categories.forEach(category => {
      categoryIdMap[category.name] = category.id;
    });

    // Define the exact questions for the final 5 categories
    const templateQuestions = [
      {
        categoryName: "Explosive Ordnance Disposal (EOD) Support",
        questions: [
          "Do you have dedicated EOD support?",
          "Do your EOD technicians receive tactical team training?",
          "Do you integrate EOD into tactical planning?",
          "Do you conduct training for EOD integration with tactical operations?",
          "Do you have policies governing EOD integration in tactical operations?",
          "Is your team integrated with a bomb squad for operational capability?",
          "Does your team have the ability to integrate EOD personnel in support roles with the entry team?",
          "Does your team have EOD personnel that can support the entry team from a staging area?",
          "Does your team have the ability to call a neighboring agency for EOD support?",
          "Is your EOD team trained and prepared to provide support for render-safe operations (misfires)?"
        ]
      },
      {
        categoryName: "Mobility, Transportation & Armor Support",
        questions: [
          "Do you have armored tactical vehicles?",
          "Do you have specialized transportation for tactical operations?",
          "Do you have a mobile command post?",
          "Do you have armored ballistic shields (Level III+)?",
          "Do you have specialized mobility equipment for tactical operations?",
          "Is your team assigned or does it own an armored vehicle (independent of an MOU)?",
          "If your team does not own an armored vehicle, do you have an MOU in place to secure one for a crisis?",
          "Can your armored vehicle carry at least 8 operators?",
          "Does your team have access to a second armored vehicle through an MOU?",
          "Is your armored vehicle rated for .50-caliber defense?",
          "Does your armored vehicle have camera capability?",
          "Does your armored vehicle have SCBA capability?",
          "Is your armored vehicle equipped with multiple shooting ports?",
          "Does your armored vehicle have tow and pull capability?",
          "Is your team assigned vehicles to move all personnel to a crisis site?",
          "Is your team assigned vehicles to move all necessary tactical equipment?"
        ]
      },
      {
        categoryName: "Unique Environment & Technical Capabilities",
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
          "Do you have technical surveillance capabilities?",
          "Is your team trained in tactical tracking in urban environments?",
          "Is your team trained in land navigation?",
          "Is your team trained for integration with air support in woodland and open urban environments?",
          "Is your team trained for integration with drones in woodland and open urban environments?"
        ]
      },
      {
        categoryName: "SCBA & HAZMAT Capabilities",
        questions: [
          "Do you have SCBA equipment available for operations?",
          "Do all operators receive SCBA training?",
          "Do you conduct regular SCBA confidence and use training?",
          "Do you have policies for SCBA deployment and use?",
          "Do you have HAZMAT identification and response capabilities?",
          "Is your team equipped and trained with a PAPR (Powered Air-Purifying Respirator) system?",
          "Is your team equipped and trained with Self-Contained Breathing Apparatus (SCBA)?"
        ]
      },
      {
        categoryName: "Tactical Emergency Medical Support (TEMS)",
        questions: [
          "Do you have dedicated TEMS personnel for operations?",
          "Do your TEMS providers have tactical training?",
          "Do you integrate TEMS into operational planning?",
          "Do you have enhanced medical equipment available for operations?",
          "Do you conduct casualty evacuation training and planning?",
          "Are your tactical medics trained and equipped with basic and advanced medical capabilities based on the team's mission profiles?",
          "Does your team have access to a medical director who is on-call and able to provide onsite direction and support for tactical operations?",
          "Does your tactical medical element conduct ongoing training using core competencies of tactical medical care, including scenario-based training?",
          "Does each team member have an Individual First Aid Kit (IFAK) with tourniquets and hemostatic agents?",
          "Do your TEMS personnel maintain certifications in advanced trauma care (TCCC, TECC, or equivalent)?"
        ]
      }
    ];

    // For each category in the template, update its questions
    for (const template of templateQuestions) {
      const categoryId = categoryIdMap[template.categoryName];
      
      if (!categoryId) {
        console.log(`Warning: Category "${template.categoryName}" not found in database`);
        continue;
      }
      
      console.log(`Processing questions for category: ${template.categoryName}`);
      
      // First, delete all existing questions for this category
      await db.delete(questions).where(eq(questions.categoryId, categoryId));
      console.log(`Deleted existing questions for ${template.categoryName}`);
      
      // Insert new questions with the correct order
      for (let i = 0; i < template.questions.length; i++) {
        const questionText = template.questions[i];
        
        await db.insert(questions).values({
          id: uuid(),
          text: questionText,
          description: "Required for tiering",
          categoryId: categoryId,
          orderIndex: i + 1,
          questionType: "boolean",
          createdAt: new Date()
        });
      }
      
      console.log(`Added ${template.questions.length} questions to ${template.categoryName}`);
    }
    
    console.log("Question update batch 3 completed successfully!");
  } catch (error) {
    console.error("Error during question update batch 3:", error);
    throw error;
  }
}

// Run the function
updateTieringQuestionsPart3()
  .then(() => {
    console.log("Question update batch 3 successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Question update batch 3 failed:", error);
    process.exit(1);
  });