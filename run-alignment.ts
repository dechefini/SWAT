import { alignWithOfficialTemplate } from './align-with-official-template';

/**
 * This script runs the alignment with the official template.
 * It ensures all categories and questions match exactly what's in the official document.
 */
async function main() {
  console.log('Starting alignment with official SWAT template...');
  try {
    await alignWithOfficialTemplate();
    console.log('Successfully aligned database with official SWAT template');
  } catch (error) {
    console.error('Error during alignment:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('Alignment script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Alignment script failed:', error);
    process.exit(1);
  });