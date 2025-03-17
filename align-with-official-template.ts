import { db } from './db';
import { questions, questionCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

/**
 * This script aligns the database with the Official SWAT Tier Level Assessment Template
 * - Ensures all 16 categories exist with correct names and order
 * - Updates questions to match exact wording and order from the template
 * - Removes questions not in the official template
 */
export async function alignWithOfficialTemplate() {
  console.log('Starting alignment with Official SWAT Template...');

  // Step 1: Verify all categories exist with correct names and order
  const categoriesData = [
    { name: 'Tier 1-4 Metrics (Personnel & Leadership)', orderIndex: 1 },
    { name: 'Mission Profiles', orderIndex: 2 },
    { name: 'Individual Operator Equipment', orderIndex: 3 },
    { name: 'Sniper Equipment & Operations', orderIndex: 4 },
    { name: 'Breaching Operations', orderIndex: 5 },
    { name: 'Access & Elevated Tactics', orderIndex: 6 },
    { name: 'Less-Lethal Capabilities', orderIndex: 7 },
    { name: 'Noise Flash Diversionary Devices (NFDDs)', orderIndex: 8 },
    { name: 'Chemical Munitions', orderIndex: 9 },
    { name: 'K9 Operations & Integration', orderIndex: 10 },
    { name: 'Explosive Ordnance Disposal (EOD) Support', orderIndex: 11 },
    { name: 'Mobility, Transportation & Armor Support', orderIndex: 12 },
    { name: 'Unique Environment & Technical Capabilities', orderIndex: 13 },
    { name: 'SCBA & HAZMAT Capabilities', orderIndex: 14 },
    { name: 'Tactical Emergency Medical Support (TEMS)', orderIndex: 15 },
    { name: 'Negotiations & Crisis Response', orderIndex: 16 },
  ];

  // Get existing categories
  const existingCategories = await db.select().from(questionCategories);
  const categoryMap = new Map();
  
  // Map existing categories by name for easier lookup
  existingCategories.forEach(cat => {
    categoryMap.set(cat.name, cat);
  });

  // Process categories
  for (const categoryData of categoriesData) {
    const existingCategory = Array.from(categoryMap.values()).find(
      cat => cat.name === categoryData.name
    );

    if (existingCategory) {
      // Update existing category if needed
      if (existingCategory.orderIndex !== categoryData.orderIndex) {
        await db.update(questionCategories)
          .set({ orderIndex: categoryData.orderIndex })
          .where(eq(questionCategories.id, existingCategory.id));
        console.log(`Updated order for category: ${categoryData.name}`);
      }
    } else {
      // Create new category
      const [newCategory] = await db.insert(questionCategories)
        .values({
          name: categoryData.name,
          orderIndex: categoryData.orderIndex,
          description: `Official SWAT Tier Level Assessment category: ${categoryData.name}`
        })
        .returning();
      
      console.log(`Created new category: ${categoryData.name}`);
      categoryMap.set(categoryData.name, newCategory);
    }
  }

  // Refresh categories after updates
  const updatedCategories = await db.select().from(questionCategories);
  const categoryIdMap = new Map();
  
  updatedCategories.forEach(cat => {
    categoryIdMap.set(cat.name, cat.id);
  });

  // Step 2: Update questions for each category
  await updateCategory1Questions(categoryIdMap.get('Tier 1-4 Metrics (Personnel & Leadership)'));
  await updateCategory2Questions(categoryIdMap.get('Mission Profiles'));
  await updateCategory3Questions(categoryIdMap.get('Individual Operator Equipment'));
  await updateCategory4Questions(categoryIdMap.get('Sniper Equipment & Operations'));
  await updateCategory5Questions(categoryIdMap.get('Breaching Operations'));
  await updateCategory6Questions(categoryIdMap.get('Access & Elevated Tactics'));
  await updateCategory7Questions(categoryIdMap.get('Less-Lethal Capabilities'));
  await updateCategory8Questions(categoryIdMap.get('Noise Flash Diversionary Devices (NFDDs)'));
  await updateCategory9Questions(categoryIdMap.get('Chemical Munitions'));
  await updateCategory10Questions(categoryIdMap.get('K9 Operations & Integration'));
  await updateCategory11Questions(categoryIdMap.get('Explosive Ordnance Disposal (EOD) Support'));
  await updateCategory12Questions(categoryIdMap.get('Mobility, Transportation & Armor Support'));
  await updateCategory13Questions(categoryIdMap.get('Unique Environment & Technical Capabilities'));
  await updateCategory14Questions(categoryIdMap.get('SCBA & HAZMAT Capabilities'));
  await updateCategory15Questions(categoryIdMap.get('Tactical Emergency Medical Support (TEMS)'));
  await updateCategory16Questions(categoryIdMap.get('Negotiations & Crisis Response'));

  console.log('Alignment with Official SWAT Template completed successfully.');
}

async function updateCategory1Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Do you have 34 or more total members?', type: 'boolean' },
    { text: 'Do you have 25-33 members?', type: 'boolean' },
    { text: 'Do you have 16-24 members?', type: 'boolean' },
    { text: 'Do you have 15 or fewer members?', type: 'boolean' },
    { text: 'Do you have a designated team commander?', type: 'boolean' },
    { text: 'Do you have 4 or more team leaders?', type: 'boolean' },
    { text: 'Do you have 2 or fewer team leaders?', type: 'boolean' },
    { text: 'Do you have 8 or more snipers?', type: 'boolean' },
    { text: 'Do you have 6-7 snipers?', type: 'boolean' },
    { text: 'Do you have 18 or more dedicated entry operators?', type: 'boolean' },
    { text: 'Do you have 12-17 dedicated entry operators?', type: 'boolean' },
    { text: 'Do you have 11 or fewer dedicated entry operators?', type: 'boolean' },
    { text: 'Do you have 3 or more TEMS personnel?', type: 'boolean' },
    { text: 'Do you have 2 TEMS personnel?', type: 'boolean' },
    { text: 'Do you have at least 1 TEMS personnel?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 1 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory2Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Do you train and prepare for terrorist response operations?', type: 'boolean' },
    { text: 'Do you train and conduct critical infrastructure protection?', type: 'boolean' },
    { text: 'Do you train and conduct dignitary protection operations?', type: 'boolean' },
    { text: 'Do you train and prepare for sniper operations?', type: 'boolean' },
    { text: 'Do you train or conduct man-tracking operations (rural/woodland)?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 2 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory3Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Do all your members have at least Level IIIA body armor & rifle plates?', type: 'boolean' },
    { text: 'Do all your members have at least Level IIIA ballistic helmets?', type: 'boolean' },
    { text: 'Do all operators have helmet-mounted white light systems?', type: 'boolean' },
    { text: 'Do all operators have helmet-mounted IR light source?', type: 'boolean' },
    { text: 'Do all operators have gas masks?', type: 'boolean' },
    { text: 'Do all operators have voice amplifiers for gas masks?', type: 'boolean' },
    { text: 'Do all members have integrated communications (team-wide)?', type: 'boolean' },
    { text: 'Do all operators have Level 2+ retention holsters?', type: 'boolean' },
    { text: 'Do all members have noise-canceling ear protection?', type: 'boolean' },
    { text: 'Do all operators have Night Vision (BNVD, Monocular, PANO)?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 3 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory4Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Do you maintain training records, lesson plans, and research selection processes for snipers?', type: 'boolean' },
    { text: 'Do you maintain certifications, qualifications, and records of weapons modifications & ammo inventories?', type: 'boolean' },
    { text: 'Do snipers have a hydration system?', type: 'boolean' },
    { text: 'Do snipers have a spotting scope?', type: 'boolean' },
    { text: 'Do snipers have a long-range camera system?', type: 'boolean' },
    { text: 'Do snipers have binoculars?', type: 'boolean' },
    { text: 'Do snipers have a rangefinder?', type: 'boolean' },
    { text: 'Do snipers have a white light source?', type: 'boolean' },
    { text: 'Do snipers have a hands-free white light or low-visibility red/green/blue light?', type: 'boolean' },
    { text: 'Does each sniper have night vision (BNVD, Monocular, PANO)?', type: 'boolean' },
    { text: 'Does each sniper have a precision rifle?', type: 'boolean' },
    { text: 'Do snipers maintain a logbook for maintenance & tracking rifle performance?', type: 'boolean' },
    { text: 'Do snipers use magnified optics?', type: 'boolean' },
    { text: 'Do snipers have clip-on night vision for magnified optics?', type: 'boolean' },
    { text: 'Do snipers have an IR illuminator?', type: 'boolean' },
    { text: 'Do snipers have an IR laser handheld for target identification?', type: 'boolean' },
    { text: 'Are snipers equipped with ammunition capable of engagements through intermediate glass?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 4 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory5Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have manual breaching tools?', type: 'boolean' },
    { text: 'Does your team have hydraulic breaching tools?', type: 'boolean' },
    { text: 'Does your team have ballistic breaching capability?', type: 'boolean' },
    { text: 'Does your team have thermal/exothermic breaching capability?', type: 'boolean' },
    { text: 'Does your team have explosive breaching capability?', type: 'boolean' },
    { text: 'Does your team have mechanical breaching capability?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 5 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory6Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have ladder systems?', type: 'boolean' },
    { text: 'Does your team have rappel equipment?', type: 'boolean' },
    { text: 'Does your team have fast-rope equipment?', type: 'boolean' },
    { text: 'Does your team have elevated rescue equipment?', type: 'boolean' },
    { text: 'Does your team have pole cameras or other surveillance equipment?', type: 'boolean' },
    { text: 'Does your team have tactical mirrors?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 6 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory7Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have extended range impact munitions?', type: 'boolean' },
    { text: 'Does your team have pepper ball systems?', type: 'boolean' },
    { text: 'Does your team have electronic control weapons (ECW/Tasers)?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 7 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory8Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have hand-deployed distraction devices?', type: 'boolean' },
    { text: 'Does your team have pole-deployed distraction devices?', type: 'boolean' },
    { text: 'Does your team have multiple port capability for NFDDs?', type: 'boolean' },
    { text: 'Does your team have time-delay capability for NFDDs?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 8 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory9Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have chemical munitions projectors?', type: 'boolean' },
    { text: 'Does your team have hand-deployed CS?', type: 'boolean' },
    { text: 'Does your team have hand-deployed OC?', type: 'boolean' },
    { text: 'Does your team have hand-deployed smoke?', type: 'boolean' },
    { text: 'Does your team have a 37mm deployment system?', type: 'boolean' },
    { text: 'Does your team have a 40mm deployment system?', type: 'boolean' },
    { text: 'Does your team have multi-launcher deployment systems?', type: 'boolean' },
    { text: 'Does your team have pole-deployed chemical munitions?', type: 'boolean' },
    { text: 'Does your team have time-delayed chemical devices?', type: 'boolean' },
    { text: 'Does your team have Vapor-OC/CS systems?', type: 'boolean' },
    { text: 'Does your team have fogger system/pepper fogger?', type: 'boolean' },
    { text: 'Does your team have a water cannon?', type: 'boolean' },
    { text: 'Does your team have OC grenades?', type: 'boolean' },
    { text: 'Does your team have CS grenades?', type: 'boolean' },
    { text: 'Does your team have smoke grenades?', type: 'boolean' },
    { text: 'Does your team have IR obscuring smoke?', type: 'boolean' },
    { text: 'Does your team have pyrotechnic delivery systems?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 9 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory10Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have patrol K9s?', type: 'boolean' },
    { text: 'Does your team have tactical K9s?', type: 'boolean' },
    { text: 'Does your team have explosive detection K9s?', type: 'boolean' },
    { text: 'Does your team have narcotics detection K9s?', type: 'boolean' },
    { text: 'Does your team have tracking K9s?', type: 'boolean' },
    { text: 'Does your team have bloodhounds?', type: 'boolean' },
    { text: 'Does your team have cadaver/HRD K9s?', type: 'boolean' },
    { text: 'Does your team have comfort K9s?', type: 'boolean' },
    { text: 'Does your team integrate K9s in tactical operations?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 10 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory11Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have EOD capability or trained EOD personnel?', type: 'boolean' },
    { text: 'Is your team equipped with robot(s) for EOD operations?', type: 'boolean' },
    { text: 'Does your team have access to x-ray capability for suspicious packages?', type: 'boolean' },
    { text: 'Does your team have or have access to EOD bomb suits?', type: 'boolean' },
    { text: 'Does your team have or have access to EOD disruption devices?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 11 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory12Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have vehicles specifically equipped for SWAT operations?', type: 'boolean' },
    { text: 'Does your team have armored vehicles?', type: 'boolean' },
    { text: 'Does your team have vehicles with integrated breaching platforms?', type: 'boolean' },
    { text: 'Does your team have vehicles with rescue platforms?', type: 'boolean' },
    { text: 'Does your team have vehicles with mobile command & control platforms?', type: 'boolean' },
    { text: 'Does your team have off-road vehicle capabilities (ATVs, UTVs, dirt bikes)?', type: 'boolean' },
    { text: 'Does your team have snow and ice capabilities (Snowmobiles, ATVs w/tracks)?', type: 'boolean' },
    { text: 'Does your team have access to helicopters for insertions?', type: 'boolean' },
    { text: 'Does your team have access to fixed-wing aircraft?', type: 'boolean' },
    { text: 'Does your team have air-operations capabilities?', type: 'boolean' },
    { text: 'Does your team have rappel capabilities from aircraft?', type: 'boolean' },
    { text: 'Does your team have fast-rope capabilities from aircraft?', type: 'boolean' },
    { text: 'Does your team have water vessels for tactical operations?', type: 'boolean' },
    { text: 'Does your team operate in maritime environments?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 12 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory13Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have dive capabilities?', type: 'boolean' },
    { text: 'Does your team have mountain or high-angle rescue capabilities?', type: 'boolean' },
    { text: 'Does your team have drone/UAS capabilities?', type: 'boolean' },
    { text: 'Does your team have robots for tactical operations?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 13 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory14Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have SCBA equipment?', type: 'boolean' },
    { text: 'Does your team have HAZMAT suits?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 14 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory15Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have at least one TEMS member?', type: 'boolean' },
    { text: 'Does your team have trauma bags/kits?', type: 'boolean' },
    { text: 'Does your team have rescue litters/stretchers?', type: 'boolean' },
    { text: 'Does your team have tactical extraction capabilities?', type: 'boolean' },
    { text: 'Does your team have medical evacuation protocols for injured operators?', type: 'boolean' },
    { text: 'Does your team have medical evacuation protocols for injured suspects?', type: 'boolean' },
    { text: 'Does your team have medical evacuation protocols for injured civilians?', type: 'boolean' },
    { text: 'Does your team maintain TECC equipment (tourniquets, hemostatics, etc.)?', type: 'boolean' },
    { text: 'Does your team have needle decompression capability?', type: 'boolean' },
    { text: 'Does your team have chest tube capability?', type: 'boolean' },
    { text: 'Does your team have surgical airway capability?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 15 questions (${categoryQuestions.length} questions)`);
}

async function updateCategory16Questions(categoryId: string) {
  const categoryQuestions = [
    { text: 'Does your team have a dedicated negotiation element?', type: 'boolean' },
    { text: 'Does your team have trained crisis negotiators?', type: 'boolean' },
    { text: 'Does your team have negotiation equipment (throw phones, etc.)?', type: 'boolean' },
    { text: 'Does your team train for hostage negotiation scenarios?', type: 'boolean' },
    { text: 'Does your team have mental health professionals available for consultations?', type: 'boolean' },
    { text: 'Does your team have a crisis response protocol?', type: 'boolean' },
    { text: 'Does your team train jointly with negotiators?', type: 'boolean' },
  ];

  await updateCategoryQuestions(categoryId, categoryQuestions);
  console.log(`Updated Category 16 questions (${categoryQuestions.length} questions)`);
}

/**
 * Helper function to update questions for a category
 */
async function updateCategoryQuestions(categoryId: string, questionsData: { text: string, type: string }[]) {
  // Get existing questions for this category
  const existingQuestions = await db.select().from(questions)
    .where(eq(questions.categoryId, categoryId));
  
  // Map questions by text for easier lookup
  const questionsMap = new Map();
  existingQuestions.forEach(q => {
    questionsMap.set(q.text, q);
  });

  // Create or update questions based on template data
  for (let i = 0; i < questionsData.length; i++) {
    const questionData = questionsData[i];
    const existingQuestion = existingQuestions.find(q => q.text === questionData.text);

    if (existingQuestion) {
      // Update existing question if needed
      if (
        existingQuestion.orderIndex !== i + 1 ||
        existingQuestion.questionType !== questionData.type
      ) {
        await db.update(questions)
          .set({
            orderIndex: i + 1,
            questionType: questionData.type as "boolean" | "text" | "numeric" | "select"
          })
          .where(eq(questions.id, existingQuestion.id));
      }
    } else {
      // Create new question
      await db.insert(questions)
        .values({
          text: questionData.text,
          categoryId: categoryId,
          orderIndex: i + 1,
          description: '',
          questionType: questionData.type as "boolean" | "text" | "numeric" | "select"
        });
    }
  }

  // Delete questions not in the template
  const templateTexts = questionsData.map(q => q.text);
  for (const existingQuestion of existingQuestions) {
    if (!templateTexts.includes(existingQuestion.text)) {
      await db.delete(questions)
        .where(eq(questions.id, existingQuestion.id));
    }
  }
}