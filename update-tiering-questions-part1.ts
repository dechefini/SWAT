import { db } from "./db";
import { questionCategories, questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * Updates the first batch of categories with the exact questions from the template
 */
async function updateTieringQuestionsPart1() {
  try {
    console.log("Starting to update questions batch 1...");

    // First, get all categories to have their IDs
    const categories = await db.select().from(questionCategories);
    console.log(`Found ${categories.length} categories in the database`);
    
    // Create a mapping of category names to their IDs for easier reference
    const categoryIdMap: Record<string, string> = {};
    categories.forEach(category => {
      categoryIdMap[category.name] = category.id;
    });

    // Define the exact questions for the first 5 categories
    const templateQuestions = [
      {
        categoryName: "Tier 1-4 Metrics (Personnel & Leadership)",
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
        questions: [
          "Do you maintain capability for high-risk warrant service operations?",
          "Do you maintain capability for armed barricaded subject (ABS) operations?",
          "Do you maintain capability for hostage rescue operations?",
          "Do you maintain capability for complex coordinated attacks such as those involving active shooters?",
          "Do you maintain capability for counter-sniper operations?",
          "Do you train and prepare for terrorist response operations?",
          "Do you train and conduct critical infrastructure protection?",
          "Do you train and conduct dignitary protection operations?",
          "Do you train or conduct man-tracking operations (rural/woodland)?"
        ]
      },
      {
        categoryName: "Individual Operator Equipment",
        questions: [
          "Is each operator equipped with a primary handgun?",
          "Is each operator equipped with a primary carbine/rifle?",
          "Is each operator equipped with tactical body armor (level IIIA minimum)?",
          "Is each operator equipped with a ballistic helmet?",
          "Is each operator equipped with eye protection?",
          "Is each operator equipped with hearing protection?",
          "Is each operator equipped with standard load-bearing equipment (LBE) or tactical vest?",
          "Is each operator equipped with tactical communications equipment?",
          "Is each operator equipped with a gas mask?",
          "Is each operator equipped with a flashlight?",
          "Is each operator equipped with a uniform or identifier apparel?",
          "Do all your members have at least Level IIIA body armor & rifle plates?",
          "Do all operators have helmet-mounted white light systems?",
          "Do all operators have helmet-mounted IR light source?",
          "Do all operators have voice amplifiers for gas masks?",
          "Do all members have integrated communications (team-wide)?",
          "Do all operators have Level 2+ retention holsters?",
          "Do all operators have Night Vision (BNVD, Monocular, PANO)?"
        ]
      },
      {
        categoryName: "Sniper Equipment & Operations",
        questions: [
          "Do you have dedicated precision rifle platforms for snipers?",
          "Do you have dedicated spotting scopes for sniper operations?",
          "Do you have range finding equipment for sniper operations?",
          "Do you have environmental data gathering equipment (wind meters, etc.) for sniper operations?",
          "Do you have night vision capability for sniper operations?",
          "Do you maintain training records, lesson plans, and research selection processes for snipers?",
          "Do you maintain certifications, qualifications, and records of weapons modifications & ammo inventories?",
          "Do snipers have a hydration system?",
          "Do snipers have a long-range camera system?",
          "Do snipers have binoculars?",
          "Do snipers have a hands-free white light or low-visibility red/green/blue light?",
          "Does each sniper have night vision (BNVD, Monocular, PANO)?",
          "Do snipers maintain a logbook for maintenance & tracking rifle performance?",
          "Do snipers use magnified optics?",
          "Do snipers have clip-on night vision for magnified optics?",
          "Do snipers have an IR illuminator?",
          "Do snipers have an IR laser handheld for target identification?",
          "Are snipers equipped with ammunition capable of engagements through intermediate glass?"
        ]
      },
      {
        categoryName: "Breaching Operations",
        questions: [
          "Do you have dedicated breaching personnel?",
          "Do you have mechanical breaching capabilities?",
          "Do you have ballistic breaching capabilities?",
          "Do you have explosive breaching capabilities?",
          "Do you conduct regular breaching training and certification?",
          "Does your team have manual breaching tools?",
          "Does your team have hydraulic breaching tools?",
          "Does your team have thermal/exothermic breaching capability?",
          "Does your team have break-and-rake tools?"
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
    
    console.log("Question update batch 1 completed successfully!");
  } catch (error) {
    console.error("Error during question update batch 1:", error);
    throw error;
  }
}

// Run the function
updateTieringQuestionsPart1()
  .then(() => {
    console.log("Question update batch 1 successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Question update batch 1 failed:", error);
    process.exit(1);
  });