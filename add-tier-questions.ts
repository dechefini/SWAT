import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function addTierQuestions() {
  console.log('Adding SWAT Tier assessment questions to database...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Personnel & Leadership Questions
    if (categoryMap.has('1. Personnel & Leadership')) {
      const personnelQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 34 or more total members?',
          description: 'Count all active sworn members',
          orderIndex: 1,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 25-33 members?',
          description: null,
          orderIndex: 2,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 16-24 members?',
          description: null,
          orderIndex: 3,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 15 or fewer members?',
          description: null,
          orderIndex: 4,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have a designated team commander?',
          description: null,
          orderIndex: 5,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 4 or more team leaders?',
          description: null,
          orderIndex: 6,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 2 or fewer team leaders?',
          description: null,
          orderIndex: 7,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 8 or more snipers?',
          description: null,
          orderIndex: 8,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 6-7 snipers?',
          description: null,
          orderIndex: 9,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 18 or more dedicated entry operators?',
          description: null,
          orderIndex: 10,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 12-17 dedicated entry operators?',
          description: null,
          orderIndex: 11,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 11 or fewer dedicated entry operators?',
          description: null,
          orderIndex: 12,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 3 or more TEMS personnel?',
          description: 'Tactical Emergency Medical Support',
          orderIndex: 13,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have 2 TEMS personnel?',
          description: null,
          orderIndex: 14,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('1. Personnel & Leadership'),
          text: 'Do you have at least 1 TEMS personnel?',
          description: null,
          orderIndex: 15,
          impactsTier: true
        }
      ];

      await addQuestionsIfNotExists(personnelQuestions);
    }

    // Mission Profiles Questions
    if (categoryMap.has('2. Mission Profiles')) {
      const missionQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('2. Mission Profiles'),
          text: 'Do you train and prepare for terrorist response operations?',
          description: null,
          orderIndex: 1,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('2. Mission Profiles'),
          text: 'Do you train and conduct critical infrastructure protection?',
          description: null,
          orderIndex: 2,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('2. Mission Profiles'),
          text: 'Do you train and conduct dignitary protection operations?',
          description: null,
          orderIndex: 3,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('2. Mission Profiles'),
          text: 'Do you train and prepare for sniper operations?',
          description: null,
          orderIndex: 4,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('2. Mission Profiles'),
          text: 'Do you train or conduct man-tracking operations (rural/woodland)?',
          description: null,
          orderIndex: 5,
          impactsTier: true
        }
      ];

      await addQuestionsIfNotExists(missionQuestions);
    }

    console.log('SWAT Tier assessment questions (Part 1) added successfully');
  } catch (error) {
    console.error('Error adding SWAT Tier questions:', error);
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
addTierQuestions();