import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Run all three update scripts in sequence to update all tiering questions
 */
async function updateAllTieringQuestions() {
  try {
    console.log("Starting comprehensive update of all tiering questions...");
    
    // Run part 1
    console.log("Running update part 1...");
    const part1Result = await execAsync('npx tsx update-tiering-questions-part1.ts');
    console.log(part1Result.stdout);
    console.log("Part 1 completed successfully");
    
    // Run part 2
    console.log("Running update part 2...");
    const part2Result = await execAsync('npx tsx update-tiering-questions-part2.ts');
    console.log(part2Result.stdout);
    console.log("Part 2 completed successfully");
    
    // Run part 3
    console.log("Running update part 3...");
    const part3Result = await execAsync('npx tsx update-tiering-questions-part3.ts');
    console.log(part3Result.stdout);
    console.log("Part 3 completed successfully");
    
    console.log("All tiering questions have been updated successfully to match the official template!");
  } catch (error) {
    console.error("Error during update process:", error);
    process.exit(1);
  }
}

// Run the function
updateAllTieringQuestions()
  .then(() => {
    console.log("Complete tiering question update completed successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Update failed:", error);
    process.exit(1);
  });