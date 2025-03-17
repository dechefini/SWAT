import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function updateGapAnalysisQuestions() {
  console.log('Updating SWAT Gap Analysis questions to match document...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Team Structure and Chain of Command
    if (categoryMap.has('Team Structure and Chain of Command')) {
      const structureQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Does your team have a written policy outlining team organization and function which includes an organizational chart?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Does your agency have a formal, written policy defining the chain of command and leadership hierarchy within the SWAT team?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Is the SWAT team organized into squads or elements, with clearly defined leaders (e.g., team leaders, squad leaders, unit commanders)?',
          description: null,
          orderIndex: 3,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Does your policy specify the maximum number of personnel that a single team leader or supervisor can effectively manage (e.g., a ratio of 1 supervisor for every 5–7 operators)?',
          description: null,
          orderIndex: 4,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Is there a designated second-in-command or deputy team leader to ensure continuity of command in case the primary leader is unavailable or incapacitated?',
          description: null,
          orderIndex: 5,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Are SWAT team leaders trained in leadership and management principles specific to tactical law enforcement operations?',
          description: null,
          orderIndex: 6,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(structureQuestions);
    }

    // Supervisor-to-Operator Ratio
    if (categoryMap.has('Supervisor-to-Operator Ratio')) {
      const ratioQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'What is the current supervisor-to-operator ratio within your SWAT team?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'text'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'Does your agency policy mandate that this ratio is maintained at all times during both training and operational deployments?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'Do team leaders regularly evaluate the span of control to ensure that the supervisor-to-operator ratio remains manageable during large-scale or extended operations?',
          description: null,
          orderIndex: 3,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'Is there a maximum span of control limit established in your agency policy for high-risk tactical operations?',
          description: null,
          orderIndex: 4,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(ratioQuestions);
    }

    // Span of Control Adjustments for Complex Operations
    if (categoryMap.has('Span of Control Adjustments for Complex Operations')) {
      const complexOpQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'Does your agency policy allow for adjustments to the span of control based on the complexity of the operation (e.g., larger teams for multi-location operations, hostage situations, or active shooter incidents)?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'In complex or large-scale operations, are additional supervisors or command staff assigned to support the SWAT team leadership?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'Does your policy provide for the delegation of specific tasks to subordinate leaders or specialists (e.g., breaching, sniper oversight, communications) to reduce the burden on the SWAT team commander?',
          description: null,
          orderIndex: 3,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Span of Control Adjustments for Complex Operations'),
          text: 'Are command post personnel integrated into the span of control policy, ensuring that field leaders have adequate support for communication and coordination?',
          description: null,
          orderIndex: 4,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(complexOpQuestions);
    }

    // Training and Evaluation of Leadership
    if (categoryMap.has('Training and Evaluation of Leadership')) {
      const leadershipQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Training and Evaluation of Leadership'),
          text: 'Are team leaders and supervisors required to undergo leadership training specific to tactical environments, including decision-making under stress, task delegation, and team management?',
          description: null,
          orderIndex: 1,
          impactsTier: false,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Training and Evaluation of Leadership'),
          text: 'Does your agency provide leadership development programs for SWAT supervisors to continuously improve their command and control skills?',
          description: null,
          orderIndex: 2,
          impactsTier: false,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(leadershipQuestions);
    }

    console.log('SWAT Gap Analysis questions (first part) updated successfully');
  } catch (error) {
    console.error('Error updating SWAT Gap Analysis questions:', error);
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
updateGapAnalysisQuestions();