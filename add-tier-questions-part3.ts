import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function addTierQuestionsPart3() {
  console.log('Adding SWAT Tier assessment questions (Part 3 - Sniper Equipment) to database...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Sniper Equipment Questions
    if (categoryMap.has('4. Sniper Equipment & Operations')) {
      const sniperQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do you maintain training records, lesson plans, and research selection processes for snipers?',
          description: null,
          orderIndex: 1,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do you maintain certifications, qualifications, and records of weapons modifications & ammo inventories?',
          description: null,
          orderIndex: 2,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a hydration system?',
          description: null,
          orderIndex: 3,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a spotting scope?',
          description: null,
          orderIndex: 4,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a long-range camera system?',
          description: null,
          orderIndex: 5,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have binoculars?',
          description: null,
          orderIndex: 6,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a rangefinder?',
          description: null,
          orderIndex: 7,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a white light source?',
          description: null,
          orderIndex: 8,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a hands-free white light or low-visibility red/green/blue light?',
          description: null,
          orderIndex: 9,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Does each sniper have night vision (BNVD, Monocular, PANO)?',
          description: null,
          orderIndex: 10,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Does each sniper have a precision rifle?',
          description: null,
          orderIndex: 11,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers maintain a logbook for maintenance & tracking rifle performance?',
          description: null,
          orderIndex: 12,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers use magnified optics?',
          description: null,
          orderIndex: 13,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have clip-on night vision for magnified optics?',
          description: null,
          orderIndex: 14,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have an IR illuminator?',
          description: 'Infrared illuminator',
          orderIndex: 15,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have an IR laser handheld for target identification?',
          description: null,
          orderIndex: 16,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Are snipers equipped with ammunition capable of engagements through intermediate glass?',
          description: null,
          orderIndex: 17,
          impactsTier: true
        }
      ];

      await addQuestionsIfNotExists(sniperQuestions);
    }

    console.log('SWAT Tier assessment questions (Part 3) added successfully');
  } catch (error) {
    console.error('Error adding SWAT Tier questions (Part 3):', error);
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
addTierQuestionsPart3();