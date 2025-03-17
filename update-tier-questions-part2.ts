import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function updateTierQuestionsPart2() {
  console.log('Updating SWAT Tier assessment questions (part 2) to match document...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Sniper Equipment & Operations
    if (categoryMap.has('4. Sniper Equipment & Operations')) {
      const sniperQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do you maintain training records, lesson plans, and research selection processes for snipers?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do you maintain certifications, qualifications, and records of weapons modifications & ammo inventories?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a hydration system?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a spotting scope?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a long-range camera system?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have binoculars?',
          description: null,
          orderIndex: 6,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a rangefinder?',
          description: null,
          orderIndex: 7,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a white light source?',
          description: null,
          orderIndex: 8,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have a hands-free white light or low-visibility red/green/blue light?',
          description: null,
          orderIndex: 9,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Does each sniper have night vision (BNVD, Monocular, PANO)?',
          description: null,
          orderIndex: 10,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Does each sniper have a precision rifle?',
          description: null,
          orderIndex: 11,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers maintain a logbook for maintenance & tracking rifle performance?',
          description: null,
          orderIndex: 12,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers use magnified optics?',
          description: null,
          orderIndex: 13,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have clip-on night vision for magnified optics?',
          description: null,
          orderIndex: 14,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have an IR illuminator?',
          description: null,
          orderIndex: 15,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Do snipers have an IR laser handheld for target identification?',
          description: null,
          orderIndex: 16,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('4. Sniper Equipment & Operations'),
          text: 'Are snipers equipped with ammunition capable of engagements through intermediate glass?',
          description: null,
          orderIndex: 17,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(sniperQuestions);
    }

    // Breaching Operations
    if (categoryMap.has('5. Breaching Operations')) {
      const breachingQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have manual breaching tools?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have hydraulic breaching tools?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have ballistic breaching capability?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have thermal/exothermic breaching capability?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have explosive breaching capability?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have break-and-rake tools?',
          description: null,
          orderIndex: 6,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(breachingQuestions);
    }

    // Access & Elevated Tactics
    if (categoryMap.has('6. Access & Elevated Tactics')) {
      const accessQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('6. Access & Elevated Tactics'),
          text: 'Does your team have individual rappel gear (ropes, bags, anchoring systems)?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('6. Access & Elevated Tactics'),
          text: 'Does your team have variable-size ladders for 1st & 2nd story access?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('6. Access & Elevated Tactics'),
          text: 'Does your team have bridging ladders for elevated horizontal or pitched access?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('6. Access & Elevated Tactics'),
          text: 'Does your team have one-person portable ladders for sniper insertion?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('6. Access & Elevated Tactics'),
          text: 'Does your team have small portable ladders (≤6ft for window porting, walls, and rescue operations)?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(accessQuestions);
    }

    // Less-Lethal Capabilities
    if (categoryMap.has('7. Less-Lethal Capabilities')) {
      const lessLethalQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('7. Less-Lethal Capabilities'),
          text: 'Does your team have short-range energizing devices (Tasers)?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('7. Less-Lethal Capabilities'),
          text: 'Does your team have medium-range 12-gauge platform and munitions?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('7. Less-Lethal Capabilities'),
          text: 'Does your team have long-range 37/40mm platform and munitions?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(lessLethalQuestions);
    }

    console.log('SWAT Tier assessment questions (part 2) updated successfully');
  } catch (error) {
    console.error('Error updating SWAT Tier questions part 2:', error);
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
updateTierQuestionsPart2();