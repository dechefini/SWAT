import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function updateTierQuestionsPart3() {
  console.log('Updating SWAT Tier assessment questions (part 3) to match document...');

  try {
    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // Map category names to their IDs
    const categoryMap = new Map();
    allCategories.forEach(category => {
      categoryMap.set(category.name, category.id);
    });

    // Noise Flash Diversionary Devices (NFDDs)
    if (categoryMap.has('8. Noise Flash Diversionary Devices (NFDDs)')) {
      const nfddQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('8. Noise Flash Diversionary Devices (NFDDs)'),
          text: 'Does your team have single-use noise flash diversionary devices (NFDDs)?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('8. Noise Flash Diversionary Devices (NFDDs)'),
          text: 'Does your team have bang pole systems for NFDD initiation?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('8. Noise Flash Diversionary Devices (NFDDs)'),
          text: 'Does your team maintain training records, lesson plans, and selection processes for NFDDs?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('8. Noise Flash Diversionary Devices (NFDDs)'),
          text: 'Does your team maintain records of certifications, inventory, and munition rotation?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(nfddQuestions);
    }

    // Chemical Munitions
    if (categoryMap.has('9. Chemical Munitions')) {
      const chemicalQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team have short-range throwable OC/CS munitions?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team have smoke munitions?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team have extension pole-mounted OC/CS munitions?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team have medium-range 12-gauge OC/CS rounds?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team have medium-range 12-gauge barricade-penetrating rounds?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team have long-range 37/40mm Ferret OC/CS rounds?',
          description: null,
          orderIndex: 6,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team have long-range 37/40mm barricade-penetrating rounds?',
          description: null,
          orderIndex: 7,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('9. Chemical Munitions'),
          text: 'Does your team maintain certification, inventory tracking, and munition rotation records?',
          description: null,
          orderIndex: 8,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(chemicalQuestions);
    }

    // K9 Operations & Integration
    if (categoryMap.has('10. K9 Operations & Integration')) {
      const k9Questions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Does your team have a K9 assigned or attached (with or without an MOU)?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Is your K9 unit trained to work with the entry team?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Is your K9 unit long-line search capable?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Is your K9 unit off-line search capable?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Is your K9 unit open-air search capable?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Is your K9 unit camera-equipped?',
          description: null,
          orderIndex: 6,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Is your K9 unit bomb-detection capable?',
          description: null,
          orderIndex: 7,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Does your K9 unit maintain training records, lesson plans, and research selection processes?',
          description: null,
          orderIndex: 8,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('10. K9 Operations & Integration'),
          text: 'Does your K9 unit maintain records of certifications, qualifications, weapons modifications, and ammunition inventories?',
          description: null,
          orderIndex: 9,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(k9Questions);
    }

    // Explosive Ordnance Disposal (EOD) Support
    if (categoryMap.has('11. Explosive Ordnance Disposal (EOD) Support')) {
      const eodQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('11. Explosive Ordnance Disposal (EOD) Support'),
          text: 'Is your team integrated with a bomb squad for operational capability?',
          description: null,
          orderIndex: 1,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('11. Explosive Ordnance Disposal (EOD) Support'),
          text: 'Does your team have the ability to integrate EOD personnel in support roles with the entry team?',
          description: null,
          orderIndex: 2,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('11. Explosive Ordnance Disposal (EOD) Support'),
          text: 'Does your team have EOD personnel that can support the entry team from a staging area?',
          description: null,
          orderIndex: 3,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('11. Explosive Ordnance Disposal (EOD) Support'),
          text: 'Does your team have the ability to call a neighboring agency for EOD support?',
          description: null,
          orderIndex: 4,
          impactsTier: true,
          questionType: 'boolean'
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('11. Explosive Ordnance Disposal (EOD) Support'),
          text: 'Is your EOD team trained and prepared to provide support for render-safe operations (misfires)?',
          description: null,
          orderIndex: 5,
          impactsTier: true,
          questionType: 'boolean'
        }
      ];

      await addQuestionsIfNotExists(eodQuestions);
    }

    console.log('SWAT Tier assessment questions (part 3) updated successfully');
  } catch (error) {
    console.error('Error updating SWAT Tier questions part 3:', error);
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
updateTierQuestionsPart3();