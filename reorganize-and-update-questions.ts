import { spawn } from 'child_process';

async function runScript(scriptPath: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`Running script: ${scriptPath}`);
    
    const process = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit'
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`Script ${scriptPath} completed successfully.`);
        resolve();
      } else {
        console.error(`Script ${scriptPath} failed with code ${code}`);
        reject(new Error(`Script failed with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      console.error(`Error executing script ${scriptPath}:`, err);
      reject(err);
    });
  });
}

async function reorganizeAndUpdateQuestions() {
  try {
    console.log("Starting comprehensive question update process...");
    
    // First, update category order to match the official document
    await runScript('./update-category-order.ts');
    
    // Remove category numbers from category names for cleaner display
    await runScript('./remove-category-numbers.ts');
    
    // Update all tiering questions
    await runScript('./update-all-tiering-questions.ts');
    
    // Add all gap analysis questions
    await runScript('./add-gap-analysis-questions.ts');
    await runScript('./add-gap-analysis-questions-part2.ts');
    await runScript('./add-gap-analysis-questions-part3.ts');
    
    // Add SOP questions
    await runScript('./update-sop-questions.ts');
    
    // Add personnel & leadership questions
    await runScript('./add-personnel-leadership-questions.ts');
    
    // Verify all categories have questions
    await runScript('./verify-category-questions.ts');
    
    console.log("Comprehensive question update process completed successfully!");
  } catch (error) {
    console.error("Error during question update process:", error);
    throw error;
  }
}

// Run if directly executed
if (import.meta.url === `file://${process.argv[1]}`) {
  reorganizeAndUpdateQuestions()
    .then(() => {
      console.log("All updates completed successfully!");
      process.exit(0);
    })
    .catch(error => {
      console.error("Update process failed:", error);
      process.exit(1);
    });
}

export { reorganizeAndUpdateQuestions };