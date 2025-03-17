import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function updateGapAnalysisQuestionsPart2() {
  console.log('Updating SWAT Gap Analysis questions (part 2) to match document...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Equipment Procurement and Allocation
    if (categoryMap.has('Equipment Procurement and Allocation')) {
      const procurementQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Does your agency have a formal, written policy for the procurement and allocation of tactical equipment for SWAT operations?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Is the equipment procurement process reviewed regularly to ensure that SWAT teams have access to the latest technology and tools?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Are equipment purchases approved through a dedicated budget, and are funding sources clearly identified?',
          description: null,
          orderIndex: 3,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Does your agency conduct regular assessments to ensure that SWAT teams are equipped with mission-specific gear tailored to the environments they are most likely to operate in (e.g., urban, rural, high-risk situations)?',
          description: null,
          orderIndex: 4,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(procurementQuestions);
    }

    // Equipment Maintenance and Inspection
    if (categoryMap.has('Equipment Maintenance and Inspection')) {
      const maintenanceQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Is there a formal maintenance policy in place that outlines the frequency and scope of inspections for all SWAT equipment (e.g., firearms, body armor, communication devices)?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Does your agency maintain detailed maintenance logs and records of repairs for all equipment used by the SWAT team?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Are there dedicated personnel or technicians assigned to oversee the maintenance and repair of specialized equipment such as armored vehicles, breaching tools, and night vision devices?',
          description: null,
          orderIndex: 3,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(maintenanceQuestions);
    }

    // Equipment Inventory Management
    if (categoryMap.has('Equipment Inventory Management')) {
      const inventoryQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Does your agency have a centralized inventory management system to track all SWAT equipment, including issuance, return, and maintenance records?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Is there a process in place for issuing and returning equipment before and after SWAT operations, ensuring accountability for all items?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Are inventory audits conducted on a regular basis to ensure all SWAT equipment is accounted for and serviceable?',
          description: null,
          orderIndex: 3,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Does your inventory system include expiration tracking for time-sensitive equipment such as medical supplies, body armor, and chemical agents?',
          description: null,
          orderIndex: 4,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(inventoryQuestions);
    }

    // Standard Operating Guidelines (SOGs)
    if (categoryMap.has('Standard Operating Guidelines (SOGs)')) {
      const sogQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Does your agency have written Standard Operating Procedures (SOPs) in place for all SWAT-related operations?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are the SOPs reviewed and updated regularly (e.g., annually) to reflect changes in tactics, technology, legal standards, or best practices?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Do your SOPs outline specific protocols for common SWAT operations such as barricaded suspects, hostage rescues, high-risk warrant service, and active shooter incidents?',
          description: null,
          orderIndex: 3,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are your SOPs accessible to all SWAT team members, including newly assigned personnel and support staff?',
          description: null,
          orderIndex: 4,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are SWAT team members trained on the specific SOPs for each type of operation before deployment, ensuring full understanding of the procedures?',
          description: null,
          orderIndex: 5,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Do your SOPs include detailed guidance on the use of force, including lethal and less-lethal options, to ensure legal compliance and safety?',
          description: null,
          orderIndex: 6,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are there SOPs in place for interagency cooperation and mutual aid responses, particularly for large-scale incidents?',
          description: null,
          orderIndex: 7,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Does your agency conduct after-action reviews (AARs) for every operation to evaluate adherence to SOPs and identify areas for improvement?',
          description: null,
          orderIndex: 8,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(sogQuestions);
    }

    console.log('SWAT Gap Analysis questions (part 2) updated successfully');
  } catch (error) {
    console.error('Error updating SWAT Gap Analysis questions part 2:', error);
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
      // Update existing question
      await db.update(questions)
        .set({
          categoryId: question.categoryId,
          description: question.description,
          orderIndex: question.orderIndex,
          impactsTier: question.impactsTier,
          questionType: question.questionType || 'boolean'
        })
        .where(eq(questions.id, existingQuestion[0].id));
      console.log(`Updated question: ${question.text.substring(0, 40)}...`);
    }
  }
}

// Execute the function
updateGapAnalysisQuestionsPart2();