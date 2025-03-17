import { db } from "./db";
import { questionCategories, questions } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from 'uuid';

/**
 * Updates the second batch of categories with the exact questions from the template
 */
async function updateTieringQuestionsPart2() {
  try {
    console.log("Starting to update questions batch 2...");

    // First, get all categories to have their IDs
    const categories = await db.select().from(questionCategories);
    console.log(`Found ${categories.length} categories in the database`);
    
    // Create a mapping of category names to their IDs for easier reference
    const categoryIdMap: Record<string, string> = {};
    categories.forEach(category => {
      categoryIdMap[category.name] = category.id;
    });

    // Define the exact questions for the second 5 categories
    const templateQuestions = [
      {
        categoryName: "Access & Elevated Tactics",
        questions: [
          "Does your team have individual rappel gear (ropes, bags, anchoring systems)?",
          "Does your team have variable-size ladders for 1st & 2nd story access?",
          "Does your team have bridging ladders for elevated horizontal or pitched access?",
          "Does your team have one-person portable ladders for sniper insertion?",
          "Does your team have small portable ladders (≤6ft for window porting, walls, and rescue operations)?",
          "Do you have specialized equipment for elevated entry?",
          "Do you have rappelling equipment and capability?",
          "Do you have training in helicopter insertion tactics?",
          "Do you train in elevated shooting platforms?",
          "Do you have policies governing operations in elevated environments?"
        ]
      },
      {
        categoryName: "Less-Lethal Capabilities",
        questions: [
          "Do you have impact projectile systems?",
          "Do you have conducted energy weapons?",
          "Do you have specialized less-lethal launchers?",
          "Do you train all operators in less-lethal deployment?",
          "Do you have policies governing less-lethal use and deployment?",
          "Does your team have short-range energizing devices (Tasers)?",
          "Does your team have medium-range 12-gauge platform and munitions?",
          "Does your team have long-range 37/40mm platform and munitions?"
        ]
      },
      {
        categoryName: "Noise Flash Diversionary Devices (NFDDs)",
        questions: [
          "Do you have NFDDs available for operations?",
          "Do you have dedicated personnel trained in NFDD deployment?",
          "Do you conduct regular training in NFDD deployment?",
          "Do you have policies governing NFDD use and deployment?",
          "Do you have documentation of NFDD inventory and deployment?",
          "Does your team have single-use noise flash diversionary devices (NFDDs)?",
          "Does your team have bang pole systems for NFDD initiation?",
          "Does your team maintain training records, lesson plans, and selection processes for NFDDs?",
          "Does your team maintain records of certifications, inventory, and munition rotation?"
        ]
      },
      {
        categoryName: "Chemical Munitions",
        questions: [
          "Do you have CS/OC delivery systems?",
          "Do you have multiple deployment methods for chemical agents?",
          "Do you train all operators in chemical agent deployment?",
          "Do you have gas mask confidence training?",
          "Do you have policies governing chemical agent use and deployment?",
          "Does your team have short-range throwable OC/CS munitions?",
          "Does your team have smoke munitions?",
          "Does your team have extension pole-mounted OC/CS munitions?",
          "Does your team have medium-range 12-gauge OC/CS rounds?",
          "Does your team have medium-range 12-gauge barricade-penetrating rounds?",
          "Does your team have long-range 37/40mm Ferret OC/CS rounds?",
          "Does your team have long-range 37/40mm barricade-penetrating rounds?",
          "Does your team maintain certification, inventory tracking, and munition rotation records?"
        ]
      },
      {
        categoryName: "K9 Operations & Integration",
        questions: [
          "Do you have dedicated tactical K9 teams?",
          "Do your K9 handlers receive tactical team training?",
          "Do you integrate K9 into tactical planning?",
          "Do you conduct training for K9 integration with tactical operations?",
          "Do you have policies governing K9 use in tactical operations?",
          "Does your team have a K9 assigned or attached (with or without an MOU)?",
          "Is your K9 unit trained to work with the entry team?",
          "Is your K9 unit long-line search capable?",
          "Is your K9 unit off-line search capable?",
          "Is your K9 unit open-air search capable?",
          "Is your K9 unit camera-equipped?",
          "Is your K9 unit bomb-detection capable?",
          "Does your K9 unit maintain training records, lesson plans, and research selection processes?",
          "Does your K9 unit maintain records of certifications, qualifications, weapons modifications, and ammunition inventories?"
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
    
    console.log("Question update batch 2 completed successfully!");
  } catch (error) {
    console.error("Error during question update batch 2:", error);
    throw error;
  }
}

// Run the function
updateTieringQuestionsPart2()
  .then(() => {
    console.log("Question update batch 2 successful!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Question update batch 2 failed:", error);
    process.exit(1);
  });