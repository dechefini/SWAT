import { db } from "./db";
import { questions } from "../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

/**
 * This script adds the missing Gap Analysis questions to the database
 * Focuses only on categories that don't have questions showing up properly
 */
async function addGapAnalysisMissingQuestions() {
  console.log("Adding missing Gap Analysis questions...");

  // First, retrieve all category IDs to reference in the questions
  const categories = await db.query.questionCategories.findMany({
    orderBy: (cats, { asc }) => [asc(cats.orderIndex)],
  });

  // Create a map for quick category lookup by name
  const categoryMap = categories.reduce((map, category) => {
    map[category.name] = category.id;
    return map;
  }, {} as Record<string, string>);

  // Get the count of existing questions for each category
  const categoriesWithMissingQuestions = [
    "Training and Evaluation of Leadership",
    "Equipment Procurement and Allocation",
    "Equipment Maintenance and Inspection",
    "Equipment Inventory Management",
    "Standard Operating Guidelines (SOGs)"
  ];

  for (const categoryName of categoriesWithMissingQuestions) {
    const categoryId = categoryMap[categoryName];
    const existingQuestions = await db.query.questions.findMany({
      where: (q, { eq }) => eq(q.categoryId, categoryId),
    });
    
    console.log(`Category '${categoryName}' has ${existingQuestions.length} questions`);
    
    // Delete existing questions for this category to start fresh
    if (existingQuestions.length > 0) {
      console.log(`Deleting ${existingQuestions.length} existing questions for category ${categoryName}`);
      await db.delete(questions).where(eq(questions.categoryId, categoryId));
    }
  }

  // Define the questions for each Gap Analysis category that's missing questions
  const missingQuestions = [
    // Training and Evaluation of Leadership (2 questions)
    {
      text: "Are team leaders and supervisors required to undergo leadership training specific to tactical environments, including decision-making under stress, task delegation, and team management?",
      description: null,
      categoryId: categoryMap["Training and Evaluation of Leadership"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Does your agency provide leadership development programs for SWAT supervisors to continuously improve their command and control skills?",
      description: null,
      categoryId: categoryMap["Training and Evaluation of Leadership"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },

    // Equipment Procurement and Allocation (4 questions)
    {
      text: "Does your agency have a formal, written policy for the procurement and allocation of tactical equipment for SWAT operations?",
      description: null,
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Is the equipment procurement process reviewed regularly to ensure that SWAT teams have access to the latest technology and tools?",
      description: null,
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Are equipment purchases approved through a dedicated budget, and are funding sources clearly identified?",
      description: null,
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Does your agency conduct regular assessments to ensure that SWAT teams are equipped with mission-specific gear tailored to the environments they are most likely to operate in (e.g., urban, rural, high-risk situations)?",
      description: null,
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },

    // Equipment Maintenance and Inspection (3 questions)
    {
      text: "Is there a formal maintenance policy in place that outlines the frequency and scope of inspections for all SWAT equipment (e.g., firearms, body armor, communication devices)?",
      description: null,
      categoryId: categoryMap["Equipment Maintenance and Inspection"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Does your agency maintain detailed maintenance logs and records of repairs for all equipment used by the SWAT team?",
      description: null,
      categoryId: categoryMap["Equipment Maintenance and Inspection"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Are there dedicated personnel or technicians assigned to oversee the maintenance and repair of specialized equipment such as armored vehicles, breaching tools, and night vision devices?",
      description: null,
      categoryId: categoryMap["Equipment Maintenance and Inspection"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },

    // Equipment Inventory Management (4 questions)
    {
      text: "Does your agency have a centralized inventory management system to track all SWAT equipment, including issuance, return, and maintenance records?",
      description: null,
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Is there a process in place for issuing and returning equipment before and after SWAT operations, ensuring accountability for all items?",
      description: null,
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Are inventory audits conducted on a regular basis to ensure all SWAT equipment is accounted for and serviceable?",
      description: null,
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Does your inventory system include expiration tracking for time-sensitive equipment such as medical supplies, body armor, and chemical agents?",
      description: null,
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },

    // Standard Operating Guidelines (SOGs) (8 questions)
    {
      text: "Does your agency have written Standard Operating Procedures (SOPs) in place for all SWAT-related operations?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Are the SOPs reviewed and updated regularly (e.g., annually) to reflect changes in tactics, technology, legal standards, or best practices?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Do your SOPs outline specific protocols for common SWAT operations such as barricaded suspects, hostage rescues, high-risk warrant service, and active shooter incidents?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Are your SOPs accessible to all SWAT team members, including newly assigned personnel and support staff?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },
    {
      text: "Are SWAT team members trained on the specific SOPs for each type of operation before deployment, ensuring full understanding of the procedures?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 5,
    },
    {
      text: "Do your SOPs include detailed guidance on the use of force, including lethal and less-lethal options, to ensure legal compliance and safety?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 6,
    },
    {
      text: "Are there SOPs in place for interagency cooperation and mutual aid responses, particularly for large-scale incidents?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 7,
    },
    {
      text: "Does your agency conduct after-action reviews (AARs) for every operation to evaluate adherence to SOPs and identify areas for improvement?",
      description: null,
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 8,
    },
  ];

  // Insert each question one by one with proper error handling
  for (const question of missingQuestions) {
    try {
      const newQuestionId = uuidv4();
      await db.insert(questions).values({
        id: newQuestionId,
        text: question.text,
        description: question.description,
        categoryId: question.categoryId as string,
        questionType: question.questionType as "boolean" | "text" | "numeric" | "select",
        tierLevel: question.tierLevel,
        orderIndex: question.orderIndex,
        validationRules: null
      });

      console.log(`Added question for ${question.categoryId}: ${question.text.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Error adding question for ${question.categoryId}: ${question.text.substring(0, 50)}...`, error);
    }
  }

  console.log("Missing Gap Analysis questions added successfully!");
}

// Run the script
addGapAnalysisMissingQuestions()
  .then(() => {
    console.log("Gap Analysis missing questions script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding Gap Analysis missing questions:", error);
    process.exit(1);
  });