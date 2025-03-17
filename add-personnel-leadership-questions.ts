import { db } from './db';
import { questions, questionCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addPersonnelLeadershipQuestions() {
  try {
    console.log("Adding Personnel & Leadership Questions...");

    // First, get the category ID for "Tier 1-4 Metrics (Personnel & Leadership)"
    const category = await db.select()
      .from(questionCategories)
      .where(eq(questionCategories.name, "Tier 1-4 Metrics (Personnel & Leadership)"))
      .limit(1);

    if (category.length === 0) {
      throw new Error("Personnel & Leadership category not found!");
    }

    const categoryId = category[0].id;
    console.log(`Found category: ${category[0].name} (${categoryId})`);

    // Define the questions for the Personnel & Leadership category
    const personnelLeadershipQuestions = [
      {
        id: "1a",
        question: "Do you have 34 or more total members on your team?",
        guidance: "Count all active members including part-time and full-time personnel.",
        questionType: "boolean"
      },
      {
        id: "1b",
        question: "Do you have at least 2 Operational Leaders?",
        guidance: "Operational Leaders are defined as personnel who can lead tactical operations in the field.",
        questionType: "boolean"
      },
      {
        id: "1c",
        question: "Do you have at least 19 members who are Operators?",
        guidance: "Operators are defined as personnel who are trained and equipped to execute tactical operations.",
        questionType: "boolean"
      },
      {
        id: "1d",
        question: "Do you have at least 4 members who are Tactical Medics?",
        guidance: "Tactical Medics are defined as personnel with specialized medical training for tactical environments.",
        questionType: "boolean"
      },
      {
        id: "1e",
        question: "Do you have at least 16 full-time members on your team?",
        guidance: "Full-time members are assigned exclusively to the SWAT team with no other responsibilities.",
        questionType: "boolean"
      },
      {
        id: "2a",
        question: "Do you have 22-33 total members on your team?",
        guidance: "Count all active members including part-time and full-time personnel.",
        questionType: "boolean"
      },
      {
        id: "2b",
        question: "Do you have at least 1 Operational Leader?",
        guidance: "Operational Leaders are defined as personnel who can lead tactical operations in the field.",
        questionType: "boolean"
      },
      {
        id: "2c",
        question: "Do you have at least 15 members who are Operators?",
        guidance: "Operators are defined as personnel who are trained and equipped to execute tactical operations.",
        questionType: "boolean"
      },
      {
        id: "2d",
        question: "Do you have at least 3 members who are Tactical Medics?",
        guidance: "Tactical Medics are defined as personnel with specialized medical training for tactical environments.",
        questionType: "boolean"
      },
      {
        id: "2e",
        question: "Do you have at least 8 full-time members on your team?",
        guidance: "Full-time members are assigned exclusively to the SWAT team with no other responsibilities.",
        questionType: "boolean"
      },
      {
        id: "3a",
        question: "Do you have 15-21 total members on your team?",
        guidance: "Count all active members including part-time and full-time personnel.",
        questionType: "boolean"
      },
      {
        id: "3b",
        question: "Do you have at least 1 Operational Leader?",
        guidance: "Operational Leaders are defined as personnel who can lead tactical operations in the field.",
        questionType: "boolean"
      },
      {
        id: "3c",
        question: "Do you have at least 12 members who are Operators?",
        guidance: "Operators are defined as personnel who are trained and equipped to execute tactical operations.",
        questionType: "boolean"
      },
      {
        id: "3d",
        question: "Do you have at least 2 members who are Tactical Medics?",
        guidance: "Tactical Medics are defined as personnel with specialized medical training for tactical environments.",
        questionType: "boolean"
      },
      {
        id: "3e",
        question: "Do you have at least 4 full-time members on your team?",
        guidance: "Full-time members are assigned exclusively to the SWAT team with no other responsibilities.",
        questionType: "boolean"
      },
      {
        id: "4a",
        question: "Do you have 10-14 total members on your team?",
        guidance: "Count all active members including part-time and full-time personnel.",
        questionType: "boolean"
      },
      {
        id: "4b",
        question: "Do you have at least 1 Operational Leader?",
        guidance: "Operational Leaders are defined as personnel who can lead tactical operations in the field.",
        questionType: "boolean"
      },
      {
        id: "4c",
        question: "Do you have at least 8 members who are Operators?",
        guidance: "Operators are defined as personnel who are trained and equipped to execute tactical operations.",
        questionType: "boolean"
      },
      {
        id: "4d",
        question: "Do you have at least 1 member who is a Tactical Medic?",
        guidance: "Tactical Medics are defined as personnel with specialized medical training for tactical environments.",
        questionType: "boolean"
      },
      {
        id: "4e",
        question: "Do you have at least 2 full-time members on your team?",
        guidance: "Full-time members are assigned exclusively to the SWAT team with no other responsibilities.",
        questionType: "boolean"
      }
    ];

    // Add questions to the database
    await addQuestionsIfExists(personnelLeadershipQuestions, categoryId);

    console.log("Personnel & Leadership Questions added successfully!");
  } catch (error) {
    console.error("Error adding Personnel & Leadership Questions:", error);
    throw error;
  }
}

async function addQuestionsIfExists(questionsToAdd: any[], categoryId: string) {
  console.log(`Adding ${questionsToAdd.length} questions to category ${categoryId}...`);

  // First, delete existing questions for this category to avoid duplicates
  const deletedCount = await db
    .delete(questions)
    .where(eq(questions.categoryId, categoryId))
    .returning();

  console.log(`Deleted ${deletedCount.length} existing questions for category ${categoryId}`);

  // Add all questions
  for (const q of questionsToAdd) {
    await db.insert(questions).values({
      text: q.question,
      description: q.guidance || null,
      categoryId: categoryId,
      questionType: q.questionType || 'boolean',
      validationRules: q.options ? { options: q.options } : {},
      orderIndex: parseInt(q.id.replace(/[^\d]/g, '')), // Extract numeric part from id for ordering
      impactsTier: true
    });
  }

  console.log(`Added ${questionsToAdd.length} questions to category ${categoryId}`);
}

async function main() {
  try {
    await addPersonnelLeadershipQuestions();
    console.log("Script completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

// Run the script if it's being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { addPersonnelLeadershipQuestions };