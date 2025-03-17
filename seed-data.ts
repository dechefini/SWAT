import { db } from './db';
import { agencies, users, questionCategories, questions } from '../shared/schema';
import { hashPassword } from './auth';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

async function seedDatabase() {
  console.log('Seeding database with initial data...');

  try {
    // Check if admin user exists
    const adminExists = await db.select().from(users).where(eq(users.email, 'admin@swat.gov'));

    if (adminExists.length === 0) {
      // Create admin user
      const adminPasswordHash = await hashPassword('admin123');
      await db.insert(users).values({
        id: randomUUID(),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@swat.gov',
        passwordHash: adminPasswordHash,
        role: 'admin',
        agencyId: null,
        permissions: ['manage_users', 'manage_agencies', 'view_all_data'],
      });
      console.log('Admin user created');
    }

    // Check if any agencies exist
    const agencyCount = await db.select().from(agencies);

    if (agencyCount.length === 0) {
      // Create sample agencies
      await db.insert(agencies).values([
        {
          id: randomUUID(),
          name: 'Los Angeles Police Department',
          jurisdiction: 'Los Angeles, CA',
          contactName: 'John Smith',
          contactEmail: 'jsmith@lapd.gov',
          contactPhone: '213-555-1234',
          size: 'large',
          status: 'active'
        },
        {
          id: randomUUID(),
          name: 'Miami-Dade Police Department',
          jurisdiction: 'Miami, FL',
          contactName: 'Maria Rodriguez',
          contactEmail: 'mrodriguez@mdpd.gov',
          contactPhone: '305-555-6789',
          size: 'medium',
          status: 'active'
        },
        {
          id: randomUUID(),
          name: 'Chicago Police Department',
          jurisdiction: 'Chicago, IL',
          contactName: 'David Johnson',
          contactEmail: 'djohnson@cpd.gov',
          contactPhone: '312-555-9876',
          size: 'large',
          status: 'active'
        }
      ]);
      console.log('Sample agencies created');
    }

    // Seed question categories and questions
    const categoryCount = await db.select().from(questionCategories);

    if (categoryCount.length === 0) {
      // Create sample question categories
      const categories = [
        {
          id: randomUUID(),
          name: 'Team Composition & Structure',
          description: 'Questions about the team size, organization, and composition',
          orderIndex: 1
        },
        {
          id: randomUUID(),
          name: 'Specialized Roles',
          description: 'Questions about specialized roles and responsibilities within the team',
          orderIndex: 2
        },
        {
          id: randomUUID(),
          name: 'Mission Capabilities & Training',
          description: 'Questions about mission types and training requirements',
          orderIndex: 3
        },
        {
          id: randomUUID(),
          name: 'Individual Operator Equipment',
          description: 'Questions about personal equipment for team members',
          orderIndex: 4
        },
        {
          id: randomUUID(),
          name: 'Sniper Equipment & Operations',
          description: 'Questions related to sniper capabilities',
          orderIndex: 5
        },
        {
          id: randomUUID(),
          name: 'Breaching Capabilities',
          description: 'Questions about entry and breaching capabilities',
          orderIndex: 6
        },
        {
          id: randomUUID(),
          name: 'Access & Elevated Tactics',
          description: 'Questions about tactical access capabilities',
          orderIndex: 7
        }
      ];

      await db.insert(questionCategories).values(categories);
      console.log('Question categories created');

      // Get the inserted categories to use their IDs for questions
      const insertedCategories = await db.select().from(questionCategories);

      // Find the Team Composition category ID
      const teamCompositionCategory = insertedCategories.find(c => c.name === 'Team Composition & Structure');
      const specializedRolesCategory = insertedCategories.find(c => c.name === 'Specialized Roles');

      if (teamCompositionCategory && specializedRolesCategory) {
        // Add sample questions to the Team Composition category
        const teamQuestions = [
          {
            id: randomUUID(),
            categoryId: teamCompositionCategory.id,
            text: 'Do you have 34 or more total members on your team?',
            description: 'Count all active sworn members',
            orderIndex: 1,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: teamCompositionCategory.id,
            text: 'Do you have at least 2 marked patrol vehicles assigned to SWAT?',
            description: null,
            orderIndex: 2,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: teamCompositionCategory.id,
            text: 'Do you have at least 1 armored vehicle (Lenco, MRAP, etc.) assigned to SWAT?',
            description: null,
            orderIndex: 3,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: teamCompositionCategory.id,
            text: 'Do you have at least 1 command vehicle assigned to SWAT?',
            description: 'Must be specifically configured for tactical operations',
            orderIndex: 4,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: teamCompositionCategory.id,
            text: 'Do you have designated team leaders for each tactical element?',
            description: null,
            orderIndex: 5,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: teamCompositionCategory.id,
            text: 'Do you have a formalized structure with designated commanding officer?',
            description: null,
            orderIndex: 6,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: teamCompositionCategory.id,
            text: 'Is your team full-time (not collateral duty)?',
            description: null,
            orderIndex: 7,
            impactsTier: true
          }
        ];

        const specializedRolesQuestions = [
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have designated snipers/marksmen?',
            description: 'Operators specifically trained and equipped for precision shooting',
            orderIndex: 1,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have designated breachers?',
            description: 'Operators specifically trained in various breaching techniques',
            orderIndex: 2,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have designated tactical medics?',
            description: 'Medics specifically assigned to SWAT operations',
            orderIndex: 3,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have designated tactical negotiators?',
            description: 'Trained negotiators who work directly with SWAT',
            orderIndex: 4,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have a tactical dispatcher assigned to SWAT operations?',
            description: 'Dispatcher trained in tactical operations communications',
            orderIndex: 5,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have a dedicated intelligence officer?',
            description: 'Officer responsible for gathering and analyzing intelligence for operations',
            orderIndex: 6,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have at least one K9 team assigned to SWAT?',
            description: 'Tactical K9 teams trained for SWAT operations',
            orderIndex: 7,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have a designated training officer for the team?',
            description: 'Officer responsible for coordinating team training',
            orderIndex: 8,
            impactsTier: true
          },
          {
            id: randomUUID(),
            categoryId: specializedRolesCategory.id,
            text: 'Do you have an equipment/logistics officer?',
            description: 'Officer responsible for team equipment and logistics',
            orderIndex: 9,
            impactsTier: true
          }
        ];

        // Insert all questions
        await db.insert(questions).values([...teamQuestions, ...specializedRolesQuestions]);
        console.log('Sample questions created');
      }
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
