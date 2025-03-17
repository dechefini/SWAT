import { db } from './db';
import { questionCategories } from '../shared/schema';

async function getCategoryIds() {
  try {
    console.log('Fetching category IDs...');
    const categories = await db.select().from(questionCategories).orderBy(questionCategories.orderIndex);
    
    categories.forEach(cat => {
      console.log(`${cat.id} - ${cat.name}`);
    });
    
    console.log('\nTotal categories:', categories.length);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

getCategoryIds().finally(() => process.exit(0));