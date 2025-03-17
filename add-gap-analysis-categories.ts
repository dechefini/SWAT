import { db } from "./db";
import { questionCategories } from "../shared/schema";
import { v4 as uuidv4 } from "uuid";

/**
 * This script adds the Gap Analysis categories to the database
 * These are the 8 official categories from the SWAT Gap Analysis documentation
 */
async function addGapAnalysisCategories() {
  console.log("Adding Gap Analysis categories...");

  // Define the 8 Gap Analysis categories with appropriate order indexes (starting after Tier Assessment)
  const gapAnalysisCategories = [
    {
      id: uuidv4(),
      name: "Team Structure and Chain of Command",
      description: "Assessment of team organizational structure and command hierarchy",
      orderIndex: 17, // Continue after the 16 Tier Assessment categories
    },
    {
      id: uuidv4(),
      name: "Supervisor-to-Operator Ratio",
      description: "Assessment of supervision levels and supervisory ratios",
      orderIndex: 18,
    },
    {
      id: uuidv4(),
      name: "Span of Control Adjustments for Complex Operations",
      description: "Assessment of span of control adaptability for various operational scenarios",
      orderIndex: 19,
    },
    {
      id: uuidv4(),
      name: "Training and Evaluation of Leadership",
      description: "Assessment of leadership training programs and evaluation methods",
      orderIndex: 20,
    },
    {
      id: uuidv4(),
      name: "Equipment Procurement and Allocation",
      description: "Assessment of equipment acquisition processes and distribution methodology",
      orderIndex: 21,
    },
    {
      id: uuidv4(),
      name: "Equipment Maintenance and Inspection",
      description: "Assessment of equipment maintenance protocols and inspection procedures",
      orderIndex: 22,
    },
    {
      id: uuidv4(),
      name: "Equipment Inventory Management",
      description: "Assessment of inventory tracking systems and accountability measures",
      orderIndex: 23,
    },
    {
      id: uuidv4(),
      name: "Standard Operating Guidelines (SOGs)",
      description: "Assessment of established operating procedures and tactical guidelines",
      orderIndex: 24,
    },
  ];

  // Insert the categories if they don't already exist
  for (const category of gapAnalysisCategories) {
    const existingCategory = await db.query.questionCategories.findFirst({
      where: (categories, { eq }) => eq(categories.name, category.name),
    });

    if (!existingCategory) {
      const result = await db.insert(questionCategories).values({
        id: category.id,
        name: category.name,
        description: category.description,
        orderIndex: category.orderIndex,
      });

      console.log(`Added category: ${category.name}`);
    } else {
      console.log(`Category already exists: ${category.name}`);
    }
  }

  console.log("Gap Analysis categories added successfully!");
}

// Run the script
addGapAnalysisCategories()
  .then(() => {
    console.log("Gap Analysis categories script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding Gap Analysis categories:", error);
    process.exit(1);
  });