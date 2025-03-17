import { db } from './db';
import { questionCategories, questions } from '../shared/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function addSWATQuestions() {
  console.log('Adding SWAT assessment questions to database...');

  try {
    // PART 1: Add Tier Assessment Questions Categories
    
    // Create Tier Assessment Categories
    const tierCategories = [
      {
        id: randomUUID(),
        name: '1. Personnel & Leadership',
        description: 'Tier metrics for team personnel and leadership structure',
        orderIndex: 10 // Using higher indexes to ensure new categories come after existing ones
      },
      {
        id: randomUUID(),
        name: '2. Mission Profiles',
        description: 'Tier metrics for mission capabilities and training',
        orderIndex: 11
      },
      {
        id: randomUUID(),
        name: '3. Individual Operator Equipment',
        description: 'Tier metrics for personnel equipment',
        orderIndex: 12
      },
      {
        id: randomUUID(),
        name: '4. Sniper Equipment & Operations',
        description: 'Tier metrics for sniper capabilities',
        orderIndex: 13
      },
      {
        id: randomUUID(),
        name: '5. Breaching Operations',
        description: 'Tier metrics for breaching capabilities',
        orderIndex: 14
      }
    ];

    // Create Gap Analysis Categories
    const gapCategories = [
      {
        id: randomUUID(),
        name: 'Team Structure and Chain of Command',
        description: 'Assessment of team organization and command structure',
        orderIndex: 20
      },
      {
        id: randomUUID(),
        name: 'Supervisor-to-Operator Ratio',
        description: 'Assessment of supervision and span of control',
        orderIndex: 21
      },
      {
        id: randomUUID(),
        name: 'Span of Control Adjustments for Complex Operations',
        description: 'Assessment of operational control during complex missions',
        orderIndex: 22
      },
      {
        id: randomUUID(),
        name: 'Training and Evaluation of Leadership',
        description: 'Assessment of leadership development and training',
        orderIndex: 23
      },
      {
        id: randomUUID(),
        name: 'Equipment Procurement and Allocation',
        description: 'Assessment of equipment acquisition processes',
        orderIndex: 24
      },
      {
        id: randomUUID(),
        name: 'Equipment Maintenance and Inspection',
        description: 'Assessment of equipment maintenance protocols',
        orderIndex: 25
      },
      {
        id: randomUUID(),
        name: 'Equipment Inventory Management',
        description: 'Assessment of inventory tracking and management',
        orderIndex: 26
      },
      {
        id: randomUUID(),
        name: 'Standard Operating Guidelines (SOGs)',
        description: 'Assessment of policies and procedures',
        orderIndex: 27
      }
    ];

    // Insert categories
    for (const category of [...tierCategories, ...gapCategories]) {
      // Check if category already exists
      const existingCategory = await db.select().from(questionCategories).where(eq(questionCategories.name, category.name));
      if (existingCategory.length === 0) {
        await db.insert(questionCategories).values(category);
        console.log(`Added category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }

    // Fetch all categories to use their IDs
    const allCategories = await db.select().from(questionCategories);
    
    // PART 2: Add Tier Assessment Questions

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

    // Individual Operator Equipment Questions
    if (categoryMap.has('3. Individual Operator Equipment')) {
      const equipmentQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all your members have at least Level IIIA body armor & rifle plates?',
          description: null,
          orderIndex: 1,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all your members have at least Level IIIA ballistic helmets?',
          description: null,
          orderIndex: 2,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have helmet-mounted white light systems?',
          description: null,
          orderIndex: 3,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have helmet-mounted IR light source?',
          description: 'Infrared light source',
          orderIndex: 4,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have gas masks?',
          description: null,
          orderIndex: 5,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have voice amplifiers for gas masks?',
          description: null,
          orderIndex: 6,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all members have integrated communications (team-wide)?',
          description: null,
          orderIndex: 7,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have Level 2+ retention holsters?',
          description: null,
          orderIndex: 8,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all members have noise-canceling ear protection?',
          description: null,
          orderIndex: 9,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('3. Individual Operator Equipment'),
          text: 'Do all operators have Night Vision (BNVD, Monocular, PANO)?',
          description: null,
          orderIndex: 10,
          impactsTier: true
        }
      ];

      await addQuestionsIfNotExists(equipmentQuestions);
    }

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

    // Breaching Operations Questions
    if (categoryMap.has('5. Breaching Operations')) {
      const breachingQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have manual breaching tools?',
          description: null,
          orderIndex: 1,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have hydraulic breaching tools?',
          description: null,
          orderIndex: 2,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have ballistic breaching capability?',
          description: null,
          orderIndex: 3,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have thermal/exothermic breaching capability?',
          description: null,
          orderIndex: 4,
          impactsTier: true
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('5. Breaching Operations'),
          text: 'Does your team have explosive breaching capability?',
          description: null,
          orderIndex: 5,
          impactsTier: true
        }
      ];

      await addQuestionsIfNotExists(breachingQuestions);
    }

    // PART 3: Add Gap Analysis Questions

    // Team Structure Questions
    if (categoryMap.has('Team Structure and Chain of Command')) {
      const structureQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Does your team have a written policy outlining team organization and function which includes an organizational chart?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Does your agency have a formal, written policy defining the chain of command and leadership hierarchy within the SWAT team?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Is the SWAT team organized into squads or elements, with clearly defined leaders (e.g., team leaders, squad leaders, unit commanders)?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Does your policy specify the maximum number of personnel that a single team leader or supervisor can effectively manage (e.g., a ratio of 1 supervisor for every 5–7 operators)?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Is there a designated second-in-command or deputy team leader to ensure continuity of command in case the primary leader is unavailable or incapacitated?',
          description: null,
          orderIndex: 5,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Team Structure and Chain of Command'),
          text: 'Are SWAT team leaders trained in leadership and management principles specific to tactical law enforcement operations?',
          description: null,
          orderIndex: 6,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(structureQuestions);
    }

    // Supervisor-to-Operator Ratio Questions
    if (categoryMap.has('Supervisor-to-Operator Ratio')) {
      const supervisorQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'What is the current supervisor-to-operator ratio within your SWAT team?',
          description: 'Please enter as 1:X where X is the number of operators per supervisor',
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'Does your agency policy mandate that this ratio is maintained at all times during both training and operational deployments?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'Do team leaders regularly evaluate the span of control to ensure that the supervisor-to-operator ratio remains manageable during large-scale or extended operations?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Supervisor-to-Operator Ratio'),
          text: 'Is there a maximum span of control limit established in your agency policy for high-risk tactical operations?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(supervisorQuestions);
    }

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

    // Equipment Maintenance Questions
    if (categoryMap.has('Equipment Maintenance and Inspection')) {
      const maintenanceQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Is there a formal maintenance policy in place that outlines the frequency and scope of inspections for all SWAT equipment (e.g., firearms, body armor, communication devices)?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Does your agency maintain detailed maintenance logs and records of repairs for all equipment used by the SWAT team?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Maintenance and Inspection'),
          text: 'Are there dedicated personnel or technicians assigned to oversee the maintenance and repair of specialized equipment such as armored vehicles, breaching tools, and night vision devices?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(maintenanceQuestions);
    }

    // Equipment Inventory Questions
    if (categoryMap.has('Equipment Inventory Management')) {
      const inventoryQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Does your agency have a centralized inventory management system to track all SWAT equipment, including issuance, return, and maintenance records?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Is there a process in place for issuing and returning equipment before and after SWAT operations, ensuring accountability for all items?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Are inventory audits conducted on a regular basis to ensure all SWAT equipment is accounted for and serviceable?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Equipment Inventory Management'),
          text: 'Does your inventory system include expiration tracking for time-sensitive equipment such as medical supplies, body armor, and chemical agents?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(inventoryQuestions);
    }

    // Standard Operating Guidelines Questions
    if (categoryMap.has('Standard Operating Guidelines (SOGs)')) {
      const sogQuestions = [
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Does your agency have written Standard Operating Procedures (SOPs) in place for all SWAT-related operations?',
          description: null,
          orderIndex: 1,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are the SOPs reviewed and updated regularly (e.g., annually) to reflect changes in tactics, technology, legal standards, or best practices?',
          description: null,
          orderIndex: 2,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Do your SOPs outline specific protocols for common SWAT operations such as barricaded suspects, hostage rescues, high-risk warrant service, and active shooter incidents?',
          description: null,
          orderIndex: 3,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are your SOPs accessible to all SWAT team members, including newly assigned personnel and support staff?',
          description: null,
          orderIndex: 4,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are SWAT team members trained on the specific SOPs for each type of operation before deployment, ensuring full understanding of the procedures?',
          description: null,
          orderIndex: 5,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Do your SOPs include detailed guidance on the use of force, including lethal and less-lethal options, to ensure legal compliance and safety?',
          description: null,
          orderIndex: 6,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Are there SOPs in place for interagency cooperation and mutual aid responses, particularly for large-scale incidents?',
          description: null,
          orderIndex: 7,
          impactsTier: false
        },
        {
          id: randomUUID(),
          categoryId: categoryMap.get('Standard Operating Guidelines (SOGs)'),
          text: 'Does your agency conduct after-action reviews (AARs) for every operation to evaluate adherence to SOPs and identify areas for improvement?',
          description: null,
          orderIndex: 8,
          impactsTier: false
        }
      ];

      await addQuestionsIfNotExists(sogQuestions);
    }

    console.log('SWAT assessment questions added successfully');
  } catch (error) {
    console.error('Error adding SWAT questions:', error);
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
addSWATQuestions();