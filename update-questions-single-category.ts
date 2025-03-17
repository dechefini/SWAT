import { db } from './db';
import { questionCategories, questions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Updates questions for a single category
 */
export async function updateQuestionsForCategory(categoryId: string) {
  console.log(`Updating questions for category ID: ${categoryId}`);
  
  // Get the category name
  const [category] = await db.select({
    id: questionCategories.id,
    name: questionCategories.name
  })
  .from(questionCategories)
  .where(eq(questionCategories.id, categoryId));
  
  if (!category) {
    console.error(`Category with ID ${categoryId} not found`);
    return;
  }
  
  console.log(`Found category: ${category.name}`);
  
  // Define questions based on category name
  let questionsData: { text: string, type: string }[] = [];
  
  switch(category.name) {
    case 'Tier 1-4 Metrics (Personnel & Leadership)':
      questionsData = [
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
      break;
      
    case 'Mission Profiles':
      questionsData = [
        { text: 'Do you train and prepare for terrorist response operations?', type: 'boolean' },
        { text: 'Do you train and conduct critical infrastructure protection?', type: 'boolean' },
        { text: 'Do you train and conduct dignitary protection operations?', type: 'boolean' },
        { text: 'Do you train and prepare for sniper operations?', type: 'boolean' },
        { text: 'Do you train or conduct man-tracking operations (rural/woodland)?', type: 'boolean' },
      ];
      break;
      
    case 'Individual Operator Equipment':
      questionsData = [
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
      break;
      
    case 'Sniper Equipment & Operations':
      questionsData = [
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
      break;
      
    case 'Breaching Operations':
      questionsData = [
        { text: 'Does your team have manual breaching tools?', type: 'boolean' },
        { text: 'Does your team have hydraulic breaching tools?', type: 'boolean' },
        { text: 'Does your team have ballistic breaching capability?', type: 'boolean' },
        { text: 'Does your team have thermal/exothermic breaching capability?', type: 'boolean' },
        { text: 'Does your team have explosive breaching capability?', type: 'boolean' },
        { text: 'Does your team have mechanical breaching capability?', type: 'boolean' },
        { text: 'Does your team have breaching training records?', type: 'boolean' },
      ];
      break;
      
    case 'Access & Elevated Tactics':
      questionsData = [
        { text: 'Does your team have ladder systems?', type: 'boolean' },
        { text: 'Does your team have rappel equipment?', type: 'boolean' },
        { text: 'Does your team have fast-rope equipment?', type: 'boolean' },
        { text: 'Does your team have elevated rescue equipment?', type: 'boolean' },
        { text: 'Does your team have pole cameras or other surveillance equipment?', type: 'boolean' },
        { text: 'Does your team have tactical mirrors?', type: 'boolean' },
      ];
      break;
      
    case 'Less-Lethal Capabilities':
      questionsData = [
        { text: 'Does your team have extended range impact munitions?', type: 'boolean' },
        { text: 'Does your team have pepper ball systems?', type: 'boolean' },
        { text: 'Does your team have electronic control weapons (ECW/Tasers)?', type: 'boolean' },
        { text: 'Does your team have a 40mm launcher?', type: 'boolean' },
        { text: 'Does your team have 12-gauge less-lethal capability?', type: 'boolean' },
        { text: 'Does your team have gas and smoke delivery systems?', type: 'boolean' },
      ];
      break;
      
    case 'Noise Flash Diversionary Devices (NFDDs)':
      questionsData = [
        { text: 'Does your team have hand-deployed distraction devices?', type: 'boolean' },
        { text: 'Does your team have pole-deployed distraction devices?', type: 'boolean' },
        { text: 'Does your team have multiple port capability for NFDDs?', type: 'boolean' },
        { text: 'Does your team have time-delay capability for NFDDs?', type: 'boolean' },
      ];
      break;
      
    case 'Chemical Munitions':
      questionsData = [
        { text: 'Does your team have chemical munitions projectors?', type: 'boolean' },
        { text: 'Does your team have hand-deployed CS?', type: 'boolean' },
        { text: 'Does your team have hand-deployed OC?', type: 'boolean' },
        { text: 'Does your team have hand-deployed smoke?', type: 'boolean' },
        { text: 'Does your team have a 37mm deployment system?', type: 'boolean' },
        { text: 'Does your team have a 40mm deployment system?', type: 'boolean' },
      ];
      break;
      
    case 'K9 Operations & Integration':
      questionsData = [
        { text: 'Does your team have patrol K9s?', type: 'boolean' },
        { text: 'Does your team have tactical K9s?', type: 'boolean' },
        { text: 'Does your team have explosive detection K9s?', type: 'boolean' },
        { text: 'Does your team have narcotics detection K9s?', type: 'boolean' },
        { text: 'Does your team have tracking K9s?', type: 'boolean' },
        { text: 'Does your team integrate K9s in tactical operations?', type: 'boolean' },
      ];
      break;
      
    case 'Explosive Ordnance Disposal (EOD) Support':
      questionsData = [
        { text: 'Does your team have EOD capability or trained EOD personnel?', type: 'boolean' },
        { text: 'Is your team equipped with robot(s) for EOD operations?', type: 'boolean' },
        { text: 'Does your team have access to x-ray capability for suspicious packages?', type: 'boolean' },
        { text: 'Does your team have or have access to EOD bomb suits?', type: 'boolean' },
        { text: 'Does your team have or have access to EOD disruption devices?', type: 'boolean' },
      ];
      break;
      
    case 'Mobility, Transportation & Armor Support':
      questionsData = [
        { text: 'Does your team have vehicles specifically equipped for SWAT operations?', type: 'boolean' },
        { text: 'Does your team have armored vehicles?', type: 'boolean' },
        { text: 'Does your team have vehicles with integrated breaching platforms?', type: 'boolean' },
        { text: 'Does your team have vehicles with rescue platforms?', type: 'boolean' },
        { text: 'Does your team have vehicles with mobile command & control platforms?', type: 'boolean' },
        { text: 'Does your team have off-road vehicle capabilities (ATVs, UTVs, dirt bikes)?', type: 'boolean' },
      ];
      break;
      
    case 'Unique Environment & Technical Capabilities':
      questionsData = [
        { text: 'Does your team have dive capabilities?', type: 'boolean' },
        { text: 'Does your team have mountain or high-angle rescue capabilities?', type: 'boolean' },
        { text: 'Does your team have drone/UAS capabilities?', type: 'boolean' },
        { text: 'Does your team have robots for tactical operations?', type: 'boolean' },
        { text: 'Does your team have night vision equipment?', type: 'boolean' },
        { text: 'Does your team have thermal imaging equipment?', type: 'boolean' },
        { text: 'Does your team have maritime/water operations capability?', type: 'boolean' },
        { text: 'Does your team have cold weather operations capability?', type: 'boolean' },
        { text: 'Does your team have technical surveillance equipment?', type: 'boolean' },
      ];
      break;
      
    case 'SCBA & HAZMAT Capabilities':
      questionsData = [
        { text: 'Does your team have SCBA equipment?', type: 'boolean' },
        { text: 'Does your team have HAZMAT response capability?', type: 'boolean' },
        { text: 'Does your team have a decontamination station?', type: 'boolean' },
        { text: 'Does your team have gas detection meters?', type: 'boolean' },
        { text: 'Does your team have technical search cameras?', type: 'boolean' },
        { text: 'Does your team have tactical radiation detection equipment?', type: 'boolean' },
      ];
      break;
      
    case 'Tactical Emergency Medical Support (TEMS)':
      questionsData = [
        { text: 'Does your team have medically trained personnel?', type: 'boolean' },
        { text: 'Does your team have medics with ALS certification?', type: 'boolean' },
        { text: 'Does your team have medics with BLS certification?', type: 'boolean' },
        { text: 'Does your team have certification to carry controlled medication?', type: 'boolean' },
        { text: 'Do your medics have extraction devices?', type: 'boolean' },
        { text: 'Do your medics have bleeding control equipment?', type: 'boolean' },
        { text: 'Do your medics have airway control devices?', type: 'boolean' },
      ];
      break;
      
    case 'Negotiations & Crisis Response':
      questionsData = [
        { text: 'Does your team have crisis negotiators?', type: 'boolean' },
        { text: 'Does your team have a negotiation team?', type: 'boolean' },
        { text: 'Does your team have negotiation communication equipment?', type: 'boolean' },
        { text: 'Does your team have access to mental health professionals?', type: 'boolean' },
        { text: 'Does your team have crisis response protocols?', type: 'boolean' },
      ];
      break;
      
    default:
      console.log(`No predefined questions for category: ${category.name}`);
      return;
  }
  
  // Get existing questions for this category
  const existingQuestions = await db.select().from(questions)
    .where(eq(questions.categoryId, categoryId));
  
  console.log(`Found ${existingQuestions.length} existing questions, updating to ${questionsData.length} questions`);
  
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
        
        console.log(`Updated question: ${questionData.text}`);
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
      
      console.log(`Created new question: ${questionData.text}`);
    }
  }

  // Delete questions not in the template
  const templateTexts = questionsData.map(q => q.text);
  for (const existingQuestion of existingQuestions) {
    if (!templateTexts.includes(existingQuestion.text)) {
      await db.delete(questions)
        .where(eq(questions.id, existingQuestion.id));
      
      console.log(`Deleted question: ${existingQuestion.text}`);
    }
  }
  
  console.log(`Completed updating questions for category: ${category.name}`);
}

// For running script directly via command line
// When imported as module, this will not execute
import { fileURLToPath } from 'url';

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  const categoryId = process.argv[2];
  
  if (!categoryId) {
    console.error('Please provide a category ID as the first argument');
    process.exit(1);
  }
  
  updateQuestionsForCategory(categoryId)
    .then(() => {
      console.log('Successfully updated questions for category');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to update questions:', error);
      process.exit(1);
    });
}