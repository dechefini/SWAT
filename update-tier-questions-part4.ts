import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function updateTierQuestionsPart4() {
  console.log('Updating SWAT Tier assessment questions (part 4) to match document...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Mobility, Transportation & Armor Support
    if (categoryMap.has('12. Mobility, Transportation & Armor Support')) {
      const mobilityQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Does your team have a dedicated armor/protected vehicle owned by the department?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Does your team have an MOU/MOA for armored vehicle from a partner agency?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Does your primary armored vehicle have .50-caliber-rated armor?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Does your primary armored vehicle have integrated camera/observation systems?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Does your primary armored vehicle have integrated SCBA/air purification?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Does your armored vehicle have towing/removal capability for disabled vehicles?',
          description: null,
          orderIndex: 6,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Do you have an MOU for a second armored vehicle from a partner agency?',
          description: null,
          orderIndex: 7,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Do you have a dedicated logistics/equipment van?',
          description: null,
          orderIndex: 8,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('12. Mobility, Transportation & Armor Support'),
          text: 'Do you have a dedicated command post vehicle?',
          description: null,
          orderIndex: 9,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(mobilityQuestions);
    }

    // Command & Control Systems
    if (categoryMap.has('13. Command & Control Systems')) {
      const commandQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('13. Command & Control Systems'),
          text: 'Does your team have dedicated and encrypted radio channels?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('13. Command & Control Systems'),
          text: 'Does your team have interoperable communications with partner agencies?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('13. Command & Control Systems'),
          text: 'Does your team have a portable command post system?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('13. Command & Control Systems'),
          text: 'Does your team have onsite blueprints & diagramming capability?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('13. Command & Control Systems'),
          text: 'Does your team have digital mapping & GPS tracking capability?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(commandQuestions);
    }

    // Surveillance & Intelligence
    if (categoryMap.has('14. Surveillance & Intelligence')) {
      const surveillanceQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('14. Surveillance & Intelligence'),
          text: 'Does your team have fixed surveillance capability?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('14. Surveillance & Intelligence'),
          text: 'Does your team have remote surveillance capability?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('14. Surveillance & Intelligence'),
          text: 'Does your team have throw phones with video?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('14. Surveillance & Intelligence'),
          text: 'Does your team have audio surveillance capability?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('14. Surveillance & Intelligence'),
          text: 'Does your team have robotic remote camera systems?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('14. Surveillance & Intelligence'),
          text: 'Does your team have thermal/infrared imaging capability?',
          description: null,
          orderIndex: 6,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('14. Surveillance & Intelligence'),
          text: 'Does your team have UAS/drone capability?',
          description: null,
          orderIndex: 7,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(surveillanceQuestions);
    }

    // Tactical Medical Support
    if (categoryMap.has('15. Tactical Medical Support')) {
      const medicalQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('15. Tactical Medical Support'),
          text: 'Do all operators carry individual first aid kits (IFAKs)?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('15. Tactical Medical Support'),
          text: 'Does your team have dedicated team medical kits?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('15. Tactical Medical Support'),
          text: 'Does your team have integrated tactical physicians or physician assistants?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('15. Tactical Medical Support'),
          text: 'Does your team have certified tactical medical operators (TEMS)?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('15. Tactical Medical Support'),
          text: 'Does your team have integrated mass casualty response capability?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(medicalQuestions);
    }

    // Video & Photography
    if (categoryMap.has('16. Video & Photography')) {
      const videoQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('16. Video & Photography'),
          text: 'Does your team have dedicated tactical photographers/videographers?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('16. Video & Photography'),
          text: 'Does your team have point-of-view cameras (helmet/weapon mounted)?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('16. Video & Photography'),
          text: 'Does your team have digital SLR cameras?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(videoQuestions);
    }

    // SCBA & HAZMAT Equipment
    if (categoryMap.has('17. SCBA & HAZMAT Equipment')) {
      const scbaQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('17. SCBA & HAZMAT Equipment'),
          text: 'Does your team have SCBA or PAPR capability?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('17. SCBA & HAZMAT Equipment'),
          text: 'Does your team have operators trained in SCBA use?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('17. SCBA & HAZMAT Equipment'),
          text: 'Does your team have HAZMAT detection equipment?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('17. SCBA & HAZMAT Equipment'),
          text: 'Does your team have capability for hot/warm/cold zone operations?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(scbaQuestions);
    }

    console.log('SWAT Tier assessment questions (part 4) updated successfully');
  } catch (error) {
    console.error('Error updating SWAT Tier questions part 4:', error);
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
updateTierQuestionsPart4();