import { addReportTypeColumn } from "./migrations/add-report-type-column.js";
import { testConnection } from "./db.js";

// Run migration sequence
async function runMigrations() {
  try {
    // Test database connection first
    await testConnection();
    console.log("Database connection successful, running migrations...");
    
    // Run migrations in sequence
    await addReportTypeColumn();
    
    console.log("All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Execute migrations
runMigrations();