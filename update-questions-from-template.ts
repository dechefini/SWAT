import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';
import { questions, questionCategories } from '../shared/schema';
import { v4 as uuid } from 'uuid';

/**
 * Updates questions to exactly match the official SWAT Tier Level Assessment Template
 */
async function updateQuestionsFromTemplate() {
  try {
    console.log('Starting to update questions from template...');

    // Get all existing categories to map IDs to names
    const categories = await db.select().from(questionCategories);
    const categoryMap = categories.reduce((map, category) => {
      map[category.name] = category.id;
      return map;
    }, {} as Record<string, string>);

    // Define the template questions by category
    const templateQuestions = [
      // 1. Tier 1-4 Metrics (Personnel & Leadership)
      {
        categoryName: 'Tier 1-4 Metrics (Personnel & Leadership)',
        questions: [
          { text: 'Do you have 34 or more total members?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Do you have 25-33 members?', description: 'Required for Tier 2', questionType: 'boolean' },
          { text: 'Do you have 16-24 members?', description: 'Required for Tier 3', questionType: 'boolean' },
          { text: 'Do you have 15 or fewer members?', description: 'Required for Tier 4', questionType: 'boolean' },
          { text: 'Do you have a designated team commander?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Do you have 4 or more team leaders?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do you have 2 or fewer team leaders?', description: 'Required for Tier 3 & 4', questionType: 'boolean' },
          { text: 'Do you have 8 or more snipers?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Do you have 6-7 snipers?', description: 'Required for Tier 2', questionType: 'boolean' },
          { text: 'Do you have 18 or more dedicated entry operators?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Do you have 12-17 dedicated entry operators?', description: 'Required for Tier 2 & 3', questionType: 'boolean' },
          { text: 'Do you have 11 or fewer dedicated entry operators?', description: 'Required for Tier 4', questionType: 'boolean' },
          { text: 'Do you have 3 or more TEMS personnel?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Do you have 2 TEMS personnel?', description: 'Required for Tier 2', questionType: 'boolean' },
          { text: 'Do you have at least 1 TEMS personnel?', description: 'Required for Tier 3', questionType: 'boolean' }
        ]
      },
      
      // 2. Mission Profiles
      {
        categoryName: 'Mission Profiles',
        questions: [
          { text: 'Do you train and prepare for terrorist response operations?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do you train and conduct critical infrastructure protection?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do you train and conduct dignitary protection operations?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do you train and prepare for sniper operations?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do you train or conduct man-tracking operations (rural/woodland)?', description: 'Required for Tier 1', questionType: 'boolean' }
        ]
      },
      
      // 3. Individual Operator Equipment
      {
        categoryName: 'Individual Operator Equipment',
        questions: [
          { text: 'Do all your members have at least Level IIIA body armor & rifle plates?', description: 'Required for Tier 1-3', questionType: 'boolean' },
          { text: 'Do all your members have at least Level IIIA ballistic helmets?', description: 'Required for Tier 1-3', questionType: 'boolean' },
          { text: 'Do all operators have helmet-mounted white light systems?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do all operators have helmet-mounted IR light source?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Do all operators have gas masks?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Do all operators have voice amplifiers for gas masks?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Do all members have integrated communications (team-wide)?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do all operators have Level 2+ retention holsters?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Do all members have noise-canceling ear protection?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Do all operators have Night Vision (BNVD, Monocular, PANO)?', description: 'Required for Tier 1', questionType: 'boolean' }
        ]
      },
      
      // 4. Sniper Equipment & Operations
      {
        categoryName: 'Sniper Equipment & Operations',
        questions: [
          { text: 'Do you maintain training records, lesson plans, and research selection processes for snipers?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do you maintain certifications, qualifications, and records of weapons modifications & ammo inventories?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have a hydration system?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have a spotting scope?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have a long-range camera system?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have binoculars?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have a rangefinder?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have a white light source?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have a hands-free white light or low-visibility red/green/blue light?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does each sniper have night vision (BNVD, Monocular, PANO)?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does each sniper have a precision rifle?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers maintain a logbook for maintenance & tracking rifle performance?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers use magnified optics?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do snipers have clip-on night vision for magnified optics?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Do snipers have an IR illuminator?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Do snipers have an IR laser handheld for target identification?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Are snipers equipped with ammunition capable of engagements through intermediate glass?', description: 'Required for Tier 1 & 2', questionType: 'boolean' }
        ]
      },
      
      // 5. Breaching Operations
      {
        categoryName: 'Breaching Operations',
        questions: [
          { text: 'Does your team have manual breaching tools?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Does your team have hydraulic breaching tools?', description: 'Required for Tier 1, 2, 3', questionType: 'boolean' },
          { text: 'Does your team have ballistic breaching capability?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have thermal/exothermic breaching capability?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have explosive breaching capability?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have break-and-rake tools?', description: 'Required for Tier 1, 2, 3', questionType: 'boolean' }
        ]
      },
      
      // 6. Access & Elevated Tactics
      {
        categoryName: 'Access & Elevated Tactics',
        questions: [
          { text: 'Does your team have individual rappel gear (ropes, bags, anchoring systems)?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have variable-size ladders for 1st & 2nd story access?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have bridging ladders for elevated horizontal or pitched access?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have one-person portable ladders for sniper insertion?', description: 'Required for Tier 1, 2, 3', questionType: 'boolean' },
          { text: 'Does your team have small portable ladders (≤6ft for window porting, walls, and rescue operations)?', description: 'Required for Tier 1, 2, 3', questionType: 'boolean' }
        ]
      },
      
      // 7. Less-Lethal Capabilities
      {
        categoryName: 'Less-Lethal Capabilities',
        questions: [
          { text: 'Does your team have short-range energizing devices (Tasers)?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Does your team have medium-range 12-gauge platform and munitions?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have long-range 37/40mm platform and munitions?', description: 'Required for Tier 1 & 2', questionType: 'boolean' }
        ]
      },
      
      // 8. Noise Flash Diversionary Devices (NFDDs)
      {
        categoryName: 'Noise Flash Diversionary Devices (NFDDs)',
        questions: [
          { text: 'Does your team have single-use noise flash diversionary devices (NFDDs)?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have bang pole systems for NFDD initiation?', description: 'Required for Tier 1-3', questionType: 'boolean' },
          { text: 'Does your team maintain training records, lesson plans, and selection processes for NFDDs?', description: 'Required for Tier 1-3', questionType: 'boolean' },
          { text: 'Does your team maintain records of certifications, inventory, and munition rotation?', description: 'Required for Tier 1-3', questionType: 'boolean' }
        ]
      },
      
      // 9. Chemical Munitions
      {
        categoryName: 'Chemical Munitions',
        questions: [
          { text: 'Does your team have short-range throwable OC/CS munitions?', description: 'Required for Tier 1-3', questionType: 'boolean' },
          { text: 'Does your team have smoke munitions?', description: 'Required for Tier 1-3', questionType: 'boolean' },
          { text: 'Does your team have extension pole-mounted OC/CS munitions?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have medium-range 12-gauge OC/CS rounds?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have medium-range 12-gauge barricade-penetrating rounds?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have long-range 37/40mm Ferret OC/CS rounds?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have long-range 37/40mm barricade-penetrating rounds?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team maintain certification, inventory tracking, and munition rotation records?', description: 'Required for All Tiers', questionType: 'boolean' }
        ]
      },
      
      // 10. K9 Operations & Integration
      {
        categoryName: 'K9 Operations & Integration',
        questions: [
          { text: 'Does your team have a K9 assigned or attached (with or without an MOU)?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Is your K9 unit trained to work with the entry team?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Is your K9 unit long-line search capable?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Is your K9 unit off-line search capable?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Is your K9 unit open-air search capable?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Is your K9 unit camera-equipped?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Is your K9 unit bomb-detection capable?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your K9 unit maintain training records, lesson plans, and research selection processes?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your K9 unit maintain records of certifications, qualifications, weapons modifications, and ammunition inventories?', description: 'Required for Tier 1 & 2', questionType: 'boolean' }
        ]
      },
      
      // 11. Explosive Ordnance Disposal (EOD) Support
      {
        categoryName: 'Explosive Ordnance Disposal (EOD) Support',
        questions: [
          { text: 'Is your team integrated with a bomb squad for operational capability?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have the ability to integrate EOD personnel in support roles with the entry team?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have EOD personnel that can support the entry team from a staging area?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have the ability to call a neighboring agency for EOD support?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Is your EOD team trained and prepared to provide support for render-safe operations (misfires)?', description: 'Required for Tier 1', questionType: 'boolean' }
        ]
      },
      
      // 12. Mobility, Transportation & Armor Support
      {
        categoryName: 'Mobility, Transportation & Armor Support',
        questions: [
          { text: 'Does your team have specially-equipped SWAT vehicles?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have access to armored vehicles?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have access to patrol vehicles for tactical operations?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Does your team have access to transport vehicles?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Does your team have access to all-terrain vehicles for deployment in varied environments?', description: 'Required for Tier 1', questionType: 'boolean' }
        ]
      },
      
      // 13. Unique Environment & Technical Capabilities
      {
        categoryName: 'Unique Environment & Technical Capabilities',
        questions: [
          { text: 'Does your team have capabilities for maritime operations?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have capabilities for wilderness/remote rural operations?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have specially trained members for maritime operations?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have advanced camera systems for tactical intelligence?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have pole cameras and/or tactical robots?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team have thermal imaging capability?', description: 'Required for Tier 1 & 2', questionType: 'boolean' }
        ]
      },
      
      // 14. SCBA & HAZMAT Capabilities
      {
        categoryName: 'SCBA & HAZMAT Capabilities',
        questions: [
          { text: 'Does your team have Self-Contained Breathing Apparatus (SCBA) equipment?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have 4 or more sets of SCBA equipment?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have 1-3 sets of SCBA equipment?', description: 'Required for Tier 2', questionType: 'boolean' },
          { text: 'Does your team have HAZMAT suits?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have HAZMAT detection equipment?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Is your team integrated with HAZMAT resources in your jurisdiction?', description: 'Required for Tier 1 & 2', questionType: 'boolean' }
        ]
      },
      
      // 15. Tactical Emergency Medical Support (TEMS)
      {
        categoryName: 'Tactical Emergency Medical Support (TEMS)',
        questions: [
          { text: 'Does your team have at least 3 members trained in Tactical Emergency Medical Support (TEMS)?', description: 'Required for Tier 1', questionType: 'boolean' },
          { text: 'Does your team have at least 2 members trained in TEMS?', description: 'Required for Tier 2', questionType: 'boolean' },
          { text: 'Does your team have at least 1 member trained in TEMS?', description: 'Required for Tier 3', questionType: 'boolean' },
          { text: 'Do all your team members have individual medical kits?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Do all your team members maintain hemorrhage control equipment?', description: 'Required for All Tiers', questionType: 'boolean' },
          { text: 'Does your team have mass casualty medical equipment available?', description: 'Required for Tier 1 & 2', questionType: 'boolean' },
          { text: 'Does your team maintain records of TEMS training and certifications?', description: 'Required for Tier 1-3', questionType: 'boolean' },
          { text: 'Does your team conduct regular TEMS training scenarios?', description: 'Required for Tier 1 & 2', questionType: 'boolean' }
        ]
      }
    ];

    // For each category in the template
    for (const template of templateQuestions) {
      const categoryId = categoryMap[template.categoryName];
      
      if (!categoryId) {
        console.error(`Category not found: ${template.categoryName}`);
        continue;
      }
      
      console.log(`Processing category: ${template.categoryName} (ID: ${categoryId})`);
      
      // First, get existing questions for this category
      const existingQuestions = await db.select().from(questions).where(eq(questions.categoryId, categoryId));
      console.log(`Found ${existingQuestions.length} existing questions for this category`);
      
      // Create a mapping of existing question IDs that we want to preserve
      // We'll use text similarity to determine which questions to keep
      const questionIdMap = new Map<string, string>(); // Maps template text to existing question ID
      
      // Map existing questions to template questions based on similarity
      for (const eq of existingQuestions) {
        for (const tq of template.questions) {
          // Check if texts are similar
          if (
            eq.text.toLowerCase().includes(tq.text.toLowerCase().substring(0, 25)) || 
            tq.text.toLowerCase().includes(eq.text.toLowerCase().substring(0, 25))
          ) {
            questionIdMap.set(tq.text, eq.id);
            break;
          }
        }
      }
      
      // Delete existing questions for this category to prevent duplicates
      await db.delete(questions).where(eq(questions.categoryId, categoryId));
      console.log(`Deleted existing questions for category: ${template.categoryName}`);
      
      // Add the template questions for this category with preserved IDs where possible
      for (let i = 0; i < template.questions.length; i++) {
        const q = template.questions[i];
        const existingId = questionIdMap.get(q.text);
        const questionId = existingId || uuid();
        
        // Use a raw SQL insert to include the ID field
        await db.execute(sql`
          INSERT INTO questions (
            id, text, description, category_id, 
            order_index, question_type, created_at
          ) VALUES (
            ${questionId},
            ${q.text},
            ${q.description},
            ${categoryId},
            ${i + 1},
            ${q.questionType || 'boolean'},
            ${new Date()}
          )
        `);
      }
      
      console.log(`Added ${template.questions.length} template questions for category: ${template.categoryName}`);
    }

    console.log('Completed updating questions from template.');
  } catch (error) {
    console.error('Error updating questions from template:', error);
    throw error;
  }
}

// Run the function
updateQuestionsFromTemplate()
  .then(() => {
    console.log('Questions successfully updated from template!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update questions:', error);
    process.exit(1);
  });