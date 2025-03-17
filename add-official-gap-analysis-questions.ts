import { db } from "./db";
import { questions } from "../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

/**
 * This script adds the official Gap Analysis questions to the database
 * These are the exact 35 questions from the SWAT Gap Analysis document
 */
async function addOfficialGapAnalysisQuestions() {
  console.log("Adding official Gap Analysis questions...");

  // First, retrieve all category IDs to reference in the questions
  const categories = await db.query.questionCategories.findMany({
    orderBy: (cats, { asc }) => [asc(cats.orderIndex)],
  });

  // Create a map for quick category lookup by name
  const categoryMap = categories.reduce((map, category) => {
    map[category.name] = category.id;
    return map;
  }, {} as Record<string, string>);

  // Define the questions for each Gap Analysis category using the exact text from the official document
  const officialGapAnalysisQuestions = [
    // Team Structure and Chain of Command (6 questions)
    {
      text: "Does your team have a written policy outlining team organization and function which includes an organizational chart?",
      description: null,
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Does your agency have a formal, written policy defining the chain of command and leadership hierarchy within the SWAT team?",
      description: null,
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Is the SWAT team organized into squads or elements, with clearly defined leaders (e.g., team leaders, squad leaders, unit commanders)?",
      description: null,
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Does your policy specify the maximum number of personnel that a single team leader or supervisor can effectively manage (e.g., a ratio of 1 supervisor for every 5–7 operators)?",
      description: null,
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },
    {
      text: "Is there a designated second-in-command or deputy team leader to ensure continuity of command in case the primary leader is unavailable or incapacitated?",
      description: null,
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 5,
    },
    {
      text: "Are SWAT team leaders trained in leadership and management principles specific to tactical law enforcement operations?",
      description: null,
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 6,
    },

    // Supervisor-to-Operator Ratio (4 questions)
    {
      text: "What is the current supervisor-to-operator ratio within your SWAT team?",
      description: "Enter as a ratio (e.g., 1:5) or a decimal",
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Does your agency policy mandate that this ratio is maintained at all times during both training and operational deployments?",
      description: null,
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Do team leaders regularly evaluate the span of control to ensure that the supervisor-to-operator ratio remains manageable during large-scale or extended operations?",
      description: null,
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Is there a maximum span of control limit established in your agency policy for high-risk tactical operations?",
      description: null,
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },

    // Span of Control Adjustments for Complex Operations (4 questions)
    {
      text: "Does your agency policy allow for adjustments to the span of control based on the complexity of the operation (e.g., larger teams for multi-location operations, hostage situations, or active shooter incidents)?",
      description: null,
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "In complex or large-scale operations, are additional supervisors or command staff assigned to support the SWAT team leadership?",
      description: null,
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Does your policy provide for the delegation of specific tasks to subordinate leaders or specialists (e.g., breaching, sniper oversight, communications) to reduce the burden on the SWAT team commander?",
      description: null,
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Are command post personnel integrated into the span of control policy, ensuring that field leaders have adequate support for communication and coordination?",
      description: null,
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },

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

  // Delete any previously added Gap Analysis questions for each category
  const gapCategoryIds = [
    categoryMap["Team Structure and Chain of Command"],
    categoryMap["Supervisor-to-Operator Ratio"],
    categoryMap["Span of Control Adjustments for Complex Operations"],
    categoryMap["Training and Evaluation of Leadership"],
    categoryMap["Equipment Procurement and Allocation"],
    categoryMap["Equipment Maintenance and Inspection"],
    categoryMap["Equipment Inventory Management"],
    categoryMap["Standard Operating Guidelines (SOGs)"]
  ];

  // Delete existing questions for these categories
  for (const categoryId of gapCategoryIds) {
    const existingQuestions = await db.query.questions.findMany({
      where: (q, { eq }) => eq(q.categoryId, categoryId),
    });
    
    if (existingQuestions.length > 0) {
      console.log(`Deleting ${existingQuestions.length} existing questions for category ${categoryId}`);
      await db.delete(questions).where(eq(questions.categoryId, categoryId));
    }
  }

  // Insert the official Gap Analysis questions
  for (const question of officialGapAnalysisQuestions) {
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
        validationRules: null // Add this field to match schema
      });

      console.log(`Added question: ${question.text.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Error adding question: ${question.text.substring(0, 50)}...`, error);
    }
  }

  console.log("Official Gap Analysis questions added successfully!");
}

// Run the script
addOfficialGapAnalysisQuestions()
  .then(() => {
    console.log("Official Gap Analysis questions script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding official Gap Analysis questions:", error);
    process.exit(1);
  });