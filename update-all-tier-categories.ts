import { db } from './db';
import { questionCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updateAllTierCategories() {
  console.log('Updating all tier assessment categories...');

  // The 15 tier assessment categories in the exact order from the SWAT Template
  const tierCategories = [
    {
      name: "Tier 1-4 Metrics (Personnel & Leadership)",
      description: "Personnel requirements and leadership structure for SWAT team tiering assessment.",
      orderIndex: 1
    },
    {
      name: "Mission Profiles",
      description: "Types of operations the team is trained and prepared to conduct.",
      orderIndex: 2
    },
    {
      name: "Individual Operator Equipment",
      description: "Essential equipment issued to each team member.",
      orderIndex: 3
    },
    {
      name: "Sniper Equipment & Operations",
      description: "Specialized equipment and capabilities for precision marksman operations.",
      orderIndex: 4
    },
    {
      name: "Breaching Operations",
      description: "Capabilities and equipment for different types of tactical breaching.",
      orderIndex: 5
    },
    {
      name: "Access & Elevated Tactics",
      description: "Equipment and training for accessing elevated positions and specialized entry.",
      orderIndex: 6
    },
    {
      name: "Less-Lethal Capabilities",
      description: "Non-lethal force options available to the team.",
      orderIndex: 7
    },
    {
      name: "Noise Flash Diversionary Devices (NFDDs)",
      description: "Flash-bang capabilities and training requirements.",
      orderIndex: 8
    },
    {
      name: "Chemical Munitions",
      description: "CS, OC, and smoke munition capabilities.",
      orderIndex: 9
    },
    {
      name: "K9 Operations & Integration",
      description: "K9 resources and their integration with SWAT operations.",
      orderIndex: 10
    },
    {
      name: "Explosive Ordnance Disposal (EOD) Support",
      description: "Bomb squad integration and support capabilities.",
      orderIndex: 11
    },
    {
      name: "Mobility, Transportation & Armor Support",
      description: "Armored vehicles and transportation resources.",
      orderIndex: 12
    },
    {
      name: "Unique Environment & Technical Capabilities",
      description: "Specialized training for different operational environments.",
      orderIndex: 13
    },
    {
      name: "SCBA & HAZMAT Capabilities",
      description: "Equipment and training for hazardous environments.",
      orderIndex: 14
    },
    {
      name: "Tactical Emergency Medical Support (TEMS)",
      description: "Medical capabilities and personnel integrated with the team.",
      orderIndex: 15
    }
  ];

  // Ensure all categories exist
  for (const categoryData of tierCategories) {
    const existingCategory = await db.query.questionCategories.findFirst({
      where: eq(questionCategories.name, categoryData.name)
    });

    if (!existingCategory) {
      console.log(`Creating new category: ${categoryData.name}`);
      await db.insert(questionCategories).values({
        name: categoryData.name,
        description: categoryData.description,
        orderIndex: categoryData.orderIndex
      });
    } else {
      // Update existing category order if needed
      if (existingCategory.orderIndex !== categoryData.orderIndex) {
        console.log(`Updating order for category: ${categoryData.name} to ${categoryData.orderIndex}`);
        await db.update(questionCategories)
          .set({ orderIndex: categoryData.orderIndex })
          .where(eq(questionCategories.id, existingCategory.id));
      }
    }
  }

  console.log('All tier categories updated successfully');
}

async function main() {
  try {
    await updateAllTierCategories();
    console.log('Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script failed with error:', error);
    process.exit(1);
  }
}

main();