import { addAgencyTierLevelColumn } from './migrations/add-agency-tier-level-column';

async function main() {
  try {
    console.log('Running agency tier level migration...');
    const result = await addAgencyTierLevelColumn();
    console.log('Migration result:', result);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('All migrations completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  });