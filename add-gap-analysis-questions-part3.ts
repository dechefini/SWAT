import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function addGapAnalysisQuestionsPart3() {
  console.log('Adding SWAT Gap Analysis questions (Part 3) to database...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Equipment Maintenance Questions
    if (categoryMap.has('Equipment Maintenance and Inspection')) {
      const maintenanceQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Is there a formal maintenance policy in place that outlines the frequency and scope of inspections for all SWAT equipment (e.g., firearms, body armor, communication devices)?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Does your agency maintain detailed maintenance logs and records of repairs for all equipment used by the SWAT team?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Are there dedicated personnel or technicians assigned to oversee the maintenance and repair of specialized equipment such as armored vehicles, breaching tools, and night vision devices?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(maintenanceQuestions);
    }

    // Equipment Inventory Questions
    if (categoryMap.has('Equipment Inventory Management')) {
      const inventoryQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Does your agency have a centralized inventory management system to track all SWAT equipment, including issuance, return, and maintenance records?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Is there a process in place for issuing and returning equipment before and after SWAT operations, ensuring accountability for all items?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Are inventory audits conducted on a regular basis to ensure all SWAT equipment is accounted for and serviceable?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Does your inventory system include expiration tracking for time-sensitive equipment such as medical supplies, body armor, and chemical agents?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(inventoryQuestions);
    }

    // Standard Operating Guidelines Questions
    if (categoryMap.has('Standard Operating Guidelines (SOGs)')) {
      const sogQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Does your agency have written Standard Operating Procedures (SOPs) in place for all SWAT-related operations?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are the SOPs reviewed and updated regularly (e.g., annually) to reflect changes in tactics, technology, legal standards, or best practices?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Do your SOPs outline specific protocols for common SWAT operations such as barricaded suspects, hostage rescues, high-risk warrant service, and active shooter incidents?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are your SOPs accessible to all SWAT team members, including newly assigned personnel and support staff?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are SWAT team members trained on the specific SOPs for each type of operation before deployment, ensuring full understanding of the procedures?',
          description: null,
          orderIndex: 5,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Do your SOPs include detailed guidance on the use of force, including lethal and less-lethal options, to ensure legal compliance and safety?',
          description: null,
          orderIndex: 6,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are there SOPs in place for interagency cooperation and mutual aid responses, particularly for large-scale incidents?',
          description: null,
          orderIndex: 7,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Does your agency conduct after-action reviews (AARs) for every operation to evaluate adherence to SOPs and identify areas for improvement?',
          description: null,
          orderIndex: 8,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(sogQuestions);
    }

    console.log('SWAT Gap Analysis questions (Part 3) added successfully');
  } catch (error) {
    console.error('Error adding SWAT Gap Analysis questions (Part 3):', error);
  }
}

// Helper function to add questions while avoiding duplicates
async function addQuestionsIfNotExists(questionsToAdd: any[]) {
  for (const question of questionsToAdd) {
    // Check if question already exists (by text)
    const existingQuestion = await db.select().from(questions).where(eq(questions.text, question.text));
    if (existingQuestion.length === 0) {
      await db.insert(questions).values(question);
      console.log(`Added question: ${question.text.substring(0, 40)}...`);
    } else {
      console.log(`Question already exists: ${question.text.substring(0, 40)}...`);
    }
  }
}

// Execute the function
addGapAnalysisQuestionsPart3();