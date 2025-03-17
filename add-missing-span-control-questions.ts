/**
 * This script adds the missing questions for the Span of Control Adjustments for Complex Operations category
 */
import { db } from "./db";
import { questions } from "../shared/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

async function addMissingSpanControlQuestions() {
  console.log("Adding missing Span of Control Adjustments questions");

  // First find the correct category
  const spanControlCategories = await db.query.questionCategories.findMany({
    where: (categories, { like }) => like(categories.name, "%Span of Control%")
  });

  if (!spanControlCategories || spanControlCategories.length === 0) {
    console.error("Span of Control Adjustments for Complex Operations category not found");
    return;
  }

  const spanControlCategory = spanControlCategories[0];
  console.log("Found category:", spanControlCategory.name, spanControlCategory.id);
  
  // Get existing questions for this category
  const existingQuestions = await db.query.questions.findMany({
    where: (q, { eq }) => eq(q.categoryId, spanControlCategory.id)
  });

  console.log(`Found ${existingQuestions.length} existing questions in this category`);
  
  // Store existing question texts for comparison
  const existingTexts = existingQuestions.map(q => q.text.toLowerCase().trim());

  // Define the questions that should exist in this category
  const spanControlQuestions = [
    {
      text: "Does your agency policy allow for adjustments to the span of control based on the complexity of the operation (e.g., larger teams for multi-location operations, hostage situations, or active shooter incidents)?",
      orderIndex: 1,
      questionType: "boolean"
    },
    {
      text: "In complex or large-scale operations, are additional supervisors or command staff assigned to support the SWAT team leadership?",
      orderIndex: 2,
      questionType: "boolean"
    },
    {
      text: "Does your policy provide for the delegation of specific tasks to subordinate leaders or specialists (e.g., breaching, sniper oversight, communications) to reduce the burden on the SWAT team commander?",
      orderIndex: 3,
      questionType: "boolean"
    },
    {
      text: "Are command post personnel integrated into the span of control policy, ensuring that field leaders have adequate support for communication and coordination?",
      orderIndex: 4,
      questionType: "boolean"
    }
  ];

  // Filter out questions that already exist to avoid duplicates
  const missingQuestions = spanControlQuestions.filter(
    q => !existingTexts.some(existingText => 
      existingText.includes(q.text.toLowerCase().substring(0, 40))
    )
  );

  console.log(`Found ${missingQuestions.length} missing questions to add`);

  // Add the missing questions
  if (missingQuestions.length > 0) {
    for (const question of missingQuestions) {
      const id = randomUUID();
      console.log(`Adding question with ID: ${id}`);
      
      try {
        await db.insert(questions).values({
          id: id,
          categoryId: spanControlCategory.id,
          text: question.text,
          description: null,
          orderIndex: question.orderIndex,
          impactsTier: false,
          questionType: question.questionType
        });
        console.log(`Added question: ${question.text.substring(0, 40)}...`);
      } catch (error) {
        console.error(`Error adding question: ${error.message}`);
      }
    }
    console.log(`Successfully added ${missingQuestions.length} missing questions`);
  } else {
    console.log("No missing questions to add");
  }
}

// Run the function
addMissingSpanControlQuestions()
  .then(() => {
    console.log("Finished adding missing Span of Control questions");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding missing Span of Control questions:", error);
    process.exit(1);
  });