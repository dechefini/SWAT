import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * This script will update all categories one by one
 */
async function updateAllQuestionsByCategory() {
  // List of all category IDs to update
  const categoryIds = [
    "c1411a75-599f-49cf-a8b2-65e17db5f9ba", // Tier 1-4 Metrics (Personnel & Leadership)
    "3f137fcf-33c0-4d97-a4a4-7db2c28fc1c8", // Mission Profiles
    "dbb503ba-0683-49a5-8de7-03f4603773b6", // Individual Operator Equipment
    "0b9d8bf2-ffd7-4b5a-b240-41c0456a8b1c", // Sniper Equipment/Operations
    "afcd4ec5-daad-4f53-b52e-bfa2ae9b2241", // Team Equipment
    "f21a40a2-45df-4c01-8f94-3f260b8e6c8f", // Specialized Capabilities
    "1e42dbb7-2d7c-47ee-9d27-df9352a7e3b6", // Training
    "ba3b0be8-2608-436c-a5be-d85b9b1c27a2", // Operational Planning & Intelligence
    "9c0a2402-b9d6-4ad4-9f13-b8fdc0b49644", // Selection & Training of Personnel
    "e61b1b8a-bd39-46d5-b9e9-3d76e22c31ca", // Tactical Emergency Medical Support (TEMS)
    "c3a4536c-2362-4d0e-9d8e-f3c3f7ae0439", // Team Policy/SOP Questions
    "b5671417-1f5e-4e4b-99c8-54cf7a9a2b9b", // Crisis Negotiations Team (CNT)
    "0d71ceb8-bc26-459a-b01c-590df7c80d89", // Multi-Agency & Regional Capabilities
    "92ff94af-6e0f-4407-b4a3-4fd6f9c12fad", // Command and Control Systems
    "a7d2b91c-b5d0-4b16-9552-eab1e877c2cc"  // Risk Assessment & Management
  ];

  // Process each category one by one
  for (const categoryId of categoryIds) {
    try {
      console.log(`Starting update for category ID: ${categoryId}`);
      const { stdout, stderr } = await execPromise(`npx tsx update-questions-single-category.ts ${categoryId}`);
      
      if (stderr) {
        console.error(`Error for category ${categoryId}:`, stderr);
      } else {
        console.log(`Success for category ${categoryId}:`, stdout);
      }
    } catch (error) {
      console.error(`Failed to update category ${categoryId}:`, error);
    }
  }

  console.log('All categories processed');
}

// Run the function
updateAllQuestionsByCategory()
  .then(() => {
    console.log('All questions successfully updated!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update all questions:', error);
    process.exit(1);
  });