import { db } from './db';

/**
 * Migration to add question_type column to questions table
 */
async function addQuestionTypeColumn() {
  try {
    console.log('Starting migration: Adding question_type column to questions table');
    
    // Check if the column already exists to avoid errors
    const columnExists = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'question_type'
    `);
    
    if (columnExists.rows.length === 0) {
      // Add the question_type column with a default value of 'boolean'
      await db.execute(`
        ALTER TABLE questions 
        ADD COLUMN question_type TEXT DEFAULT 'boolean' NOT NULL
      `);
      console.log('Successfully added question_type column to questions table');
      
      // Add validation_rules column for advanced validation options
      await db.execute(`
        ALTER TABLE questions
        ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}'::jsonb
      `);
      console.log('Successfully added validation_rules column to questions table');
    } else {
      console.log('Column question_type already exists in questions table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Execute the migration
addQuestionTypeColumn().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});