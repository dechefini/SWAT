import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function addGapAnalysisQuestionsPart2() {
  console.log('Adding SWAT Gap Analysis questions (Part 2) to database...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Span of Control Questions
    if (categoryMap.has('Span of Control Adjustments for Complex Operations')) {
      const spanControlQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'Does your agency policy allow for adjustments to the span of control based on the complexity of the operation (e.g., larger teams for multi-location operations, hostage situations, or active shooter incidents)?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'In complex or large-scale operations, are additional supervisors or command staff assigned to support the SWAT team leadership?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'Does your policy provide for the delegation of specific tasks to subordinate leaders or specialists (e.g., breaching, sniper oversight, communications) to reduce the burden on the SWAT team commander?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'Are command post personnel integrated into the span of control policy, ensuring that field leaders have adequate support for communication and coordination?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(spanControlQuestions);
    }

    // Leadership Training Questions
    if (categoryMap.has('Training and Evaluation of Leadership')) {
      const leadershipQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Training and Evaluation of Leadership'),
          text: 'Are team leaders and supervisors required to undergo leadership training specific to tactical environments, including decision-making under stress, task delegation, and team management?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Training and Evaluation of Leadership'),
          text: 'Does your agency provide leadership development programs for SWAT supervisors to continuously improve their command and control skills?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(leadershipQuestions);
    }

    // Equipment Procurement Questions
    if (categoryMap.has('Equipment Procurement and Allocation')) {
      const procurementQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Does your agency have a formal, written policy for the procurement and allocation of tactical equipment for SWAT operations?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Is the equipment procurement process reviewed regularly to ensure that SWAT teams have access to the latest technology and tools?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Are equipment purchases approved through a dedicated budget, and are funding sources clearly identified?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Procurement and Allocation'),
          text: 'Does your agency conduct regular assessments to ensure that SWAT teams are equipped with mission-specific gear tailored to the environments they are most likely to operate in (e.g., urban, rural, high-risk situations)?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(procurementQuestions);
    }

    console.log('SWAT Gap Analysis questions (Part 2) added successfully');
  } catch (error) {
    console.error('Error adding SWAT Gap Analysis questions (Part 2):', error);
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
addGapAnalysisQuestionsPart2();