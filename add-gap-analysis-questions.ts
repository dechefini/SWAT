import { db } from "./db";
import { questions } from "../shared/schema";
import { v4 as uuidv4 } from "uuid";

/**
 * This script adds the Gap Analysis questions to the database
 * There are 35 total questions across 8 categories
 */
async function addGapAnalysisQuestions() {
  console.log("Adding Gap Analysis questions...");

  // First, retrieve all category IDs to reference in the questions
  const categories = await db.query.questionCategories.findMany({
    orderBy: (cats, { asc }) => [asc(cats.orderIndex)],
  });

  // Create a map for quick category lookup by name
  const categoryMap = categories.reduce((map, category) => {
    map[category.name] = category.id;
    return map;
  }, {} as Record<string, string>);

  // Define the questions for each Gap Analysis category
  const gapAnalysisQuestions = [
    // Team Structure and Chain of Command (6 questions)
    {
      text: "Do you have an organizational chart that clearly defines the chain of command within your SWAT team?",
      description: "The organizational chart should include all positions, reporting relationships, and specialized roles.",
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Is there a clear designation of command authority during tactical operations?",
      description: "Command authority should be explicitly defined for different scenarios and operational phases.",
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Are command roles and responsibilities clearly defined and documented?",
      description: "Documentation should specify decision-making authority and responsibilities for each command position.",
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Do you have established protocols for command transitions during extended operations?",
      description: "Protocols should address handover procedures, briefing requirements, and documentation.",
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },
    {
      text: "Is there a designated succession plan for leadership positions?",
      description: "The succession plan should identify qualified personnel for each leadership position in case of absence or incapacitation.",
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 5,
    },
    {
      text: "How frequently is your organizational structure reviewed and updated?",
      description: "Regular reviews ensure the structure remains effective and adapts to changing conditions.",
      categoryId: categoryMap["Team Structure and Chain of Command"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 6,
    },

    // Supervisor-to-Operator Ratio (4 questions)
    {
      text: "What is your current supervisor-to-operator ratio?",
      description: "Express as a ratio (e.g., 1:5) or decimal (e.g., 0.2)",
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "numeric",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Does your supervisor-to-operator ratio change based on mission type or threat assessment?",
      description: "If yes, describe how ratios are adjusted for different scenarios.",
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "What is your target supervisor-to-operator ratio for high-risk operations?",
      description: "Express as a ratio (e.g., 1:4) or decimal (e.g., 0.25)",
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "numeric",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Is there a documented policy for supervisor-to-operator ratios?",
      description: "Policy should specify minimum requirements and adjustment criteria.",
      categoryId: categoryMap["Supervisor-to-Operator Ratio"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },

    // Span of Control Adjustments for Complex Operations (4 questions)
    {
      text: "Do you have established protocols for adjusting span of control during complex operations?",
      description: "Protocols should define thresholds and procedures for span of control adjustments.",
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "What is the maximum number of operators a single supervisor can effectively manage in your experience?",
      description: "Consider both standard and complex operations in your answer.",
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "numeric",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Are supervisors trained in span of control management techniques?",
      description: "Training should cover delegation, communication, and resource management.",
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Do after-action reviews include assessment of span of control effectiveness?",
      description: "Reviews should evaluate whether span of control was appropriate and effective during operations.",
      categoryId: categoryMap["Span of Control Adjustments for Complex Operations"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },

    // Training and Evaluation of Leadership (2 questions)
    {
      text: "Do supervisors receive specific leadership training beyond tactical skills?",
      description: "Training should include management, decision-making, and leadership principles.",
      categoryId: categoryMap["Training and Evaluation of Leadership"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Is there a formal evaluation process for leadership performance?",
      description: "Process should include objective criteria and performance metrics.",
      categoryId: categoryMap["Training and Evaluation of Leadership"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 2,
    },

    // Equipment Procurement and Allocation (4 questions)
    {
      text: "Is there a formal process for identifying equipment needs and procurement priorities?",
      description: "Process should include needs assessment, prioritization, and budget considerations.",
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Who has final authority for equipment procurement decisions?",
      description: "Identify the position or committee with final approval authority.",
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "How are equipment allocation decisions made within the team?",
      description: "Describe the process for determining who receives what equipment.",
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Is there a budget specifically allocated for SWAT equipment acquisition and replacement?",
      description: "Budget should be clearly defined with renewal cycles and emergency funds.",
      categoryId: categoryMap["Equipment Procurement and Allocation"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },

    // Equipment Maintenance and Inspection (3 questions)
    {
      text: "Is there a documented schedule for routine equipment maintenance and inspection?",
      description: "Schedule should specify frequencies, responsibilities, and documentation requirements.",
      categoryId: categoryMap["Equipment Maintenance and Inspection"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "Who is responsible for ensuring equipment maintenance is performed?",
      description: "Identify positions or roles with maintenance oversight responsibility.",
      categoryId: categoryMap["Equipment Maintenance and Inspection"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Is there a process for immediately addressing equipment failures or deficiencies?",
      description: "Process should include reporting, temporary replacement, and expedited repair/replacement.",
      categoryId: categoryMap["Equipment Maintenance and Inspection"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },

    // Equipment Inventory Management (4 questions)
    {
      text: "Is there a complete inventory of all SWAT equipment with assigned responsibility?",
      description: "Inventory should include all equipment items with assigned custody.",
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "How frequently is a full equipment inventory audit conducted?",
      description: "Specify frequency and comprehensiveness of inventory audits.",
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Is there a tracking system for equipment nearing end-of-life or warranty expiration?",
      description: "System should provide advance notice of needed replacements.",
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Is there a specific position responsible for equipment inventory management?",
      description: "Identify the position with primary inventory management responsibility.",
      categoryId: categoryMap["Equipment Inventory Management"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 4,
    },

    // Standard Operating Guidelines (SOGs) (8 questions)
    {
      text: "Are comprehensive SOGs developed and documented for all routine operations?",
      description: "SOGs should cover standard tactical procedures, roles, and decision criteria.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 1,
    },
    {
      text: "How frequently are SOGs reviewed and updated?",
      description: "Specify review cycle and update procedures.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 2,
    },
    {
      text: "Is there a process for personnel to recommend SOG revisions based on field experience?",
      description: "Process should facilitate input from operators and supervisors.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 3,
    },
    {
      text: "Are SOGs regularly incorporated into training scenarios?",
      description: "Training should reinforce and evaluate adherence to SOGs.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 4,
    },
    {
      text: "Is there a process for temporary deviation from SOGs when operationally necessary?",
      description: "Process should specify approval authority and documentation requirements.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 5,
    },
    {
      text: "Who has final authority for approving SOG changes?",
      description: "Identify position or committee with approval authority.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "text",
      tierLevel: null,
      orderIndex: 6,
    },
    {
      text: "Are SOGs accessible to all team members during operations?",
      description: "Consider both physical and digital accessibility.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 7,
    },
    {
      text: "Do AARs (After Action Reviews) include assessment of SOG compliance and effectiveness?",
      description: "Reviews should evaluate adherence to SOGs and identify improvement opportunities.",
      categoryId: categoryMap["Standard Operating Guidelines (SOGs)"],
      questionType: "boolean",
      tierLevel: null,
      orderIndex: 8,
    },
  ];

  // Insert the questions if they don't already exist
  for (const question of gapAnalysisQuestions) {
    const existingQuestion = await db.query.questions.findFirst({
      where: (q, { eq, and }) => 
        and(
          eq(q.text, question.text),
          eq(q.categoryId, question.categoryId as string)
        ),
    });

    if (!existingQuestion) {
      await db.insert(questions).values({
        id: uuidv4(),
        text: question.text,
        description: question.description,
        categoryId: question.categoryId as string,
        questionType: question.questionType,
        tierLevel: question.tierLevel,
        orderIndex: question.orderIndex,
      });

      console.log(`Added question: ${question.text.substring(0, 50)}...`);
    } else {
      console.log(`Question already exists: ${question.text.substring(0, 50)}...`);
    }
  }

  console.log("Gap Analysis questions added successfully!");
}

// Run the script
addGapAnalysisQuestions()
  .then(() => {
    console.log("Gap Analysis questions script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding Gap Analysis questions:", error);
    process.exit(1);
  });