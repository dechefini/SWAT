import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function addTierQuestionsPart2() {
  console.log('Adding SWAT Tier assessment questions (Part 2) to database...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Individual Operator Equipment Questions
    if (categoryMap.has('3. Individual Operator Equipment')) {
      const equipmentQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all your members have at least Level IIIA body armor & rifle plates?',
          description: null,
          orderIndex: 1,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all your members have at least Level IIIA ballistic helmets?',
          description: null,
          orderIndex: 2,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have helmet-mounted white light systems?',
          description: null,
          orderIndex: 3,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have helmet-mounted IR light source?',
          description: 'Infrared light source',
          orderIndex: 4,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have gas masks?',
          description: null,
          orderIndex: 5,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have voice amplifiers for gas masks?',
          description: null,
          orderIndex: 6,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all members have integrated communications (team-wide)?',
          description: null,
          orderIndex: 7,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have Level 2+ retention holsters?',
          description: null,
          orderIndex: 8,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all members have noise-canceling ear protection?',
          description: null,
          orderIndex: 9,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have Night Vision (BNVD, Monocular, PANO)?',
          description: null,
          orderIndex: 10,
          impactsTier: true
        }
      ];

      await addQuestionsIfNotExists(equipmentQuestions);
    }

    // Breaching Operations Questions
    if (categoryMap.has('5. Breaching Operations')) {
      const breachingQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have manual breaching tools?',
          description: null,
          orderIndex: 1,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have hydraulic breaching tools?',
          description: null,
          orderIndex: 2,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have ballistic breaching capability?',
          description: null,
          orderIndex: 3,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have thermal/exothermic breaching capability?',
          description: null,
          orderIndex: 4,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have explosive breaching capability?',
          description: null,
          orderIndex: 5,
          impactsTier: true
        }
      ];

      await addQuestionsIfNotExists(breachingQuestions);
    }

    console.log('SWAT Tier assessment questions (Part 2) added successfully');
  } catch (error) {
    console.error('Error adding SWAT Tier questions (Part 2):', error);
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
addTierQuestionsPart2();