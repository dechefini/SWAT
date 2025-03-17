import { db } from "./db";
import { questions } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

// This script updates the SOP assessment questions to exactly match the order
// in the official documentation provided by the user.

async function updateSopQuestions() {
  console.log("Updating SWAT SOP questions to exact document order...");
  
  try {
    // Team Structure and Chain of Command
    const teamStructureQuestions = [
      { text: "Does your team have a written policy outlining team organization and function which includes an organizational chart?", orderIndex: 101 },
      { text: "Does your agency have a formal, written policy defining the chain of command and leadership hierarchy within the SWAT team?", orderIndex: 102 },
      { text: "Is the SWAT team organized into squads or elements, with clearly defined leaders (e.g., team leaders, squad leaders, unit commanders)?", orderIndex: 103 },
      { text: "Does your policy specify the maximum number of personnel that a single team leader or supervisor can effectively manage (e.g., a ratio of 1 supervisor for every 5–7 operators)?", orderIndex: 104 },
      { text: "Is there a designated second-in-command or deputy team leader to ensure continuity of command in case the primary leader is unavailable or incapacitated?", orderIndex: 105 },
      { text: "Are SWAT team leaders trained in leadership and management principles specific to tactical law enforcement operations?", orderIndex: 106 }
    ];
    
    // Supervisor-to-Operator Ratio
    const supervisorRatioQuestions = [
      { text: "What is the current supervisor-to-operator ratio within your SWAT team?", orderIndex: 107 },
      { text: "Does your agency policy mandate that this ratio is maintained at all times during both training and operational deployments?", orderIndex: 108 },
      { text: "Do team leaders regularly evaluate the span of control to ensure that the supervisor-to-operator ratio remains manageable during large-scale or extended operations?", orderIndex: 109 },
      { text: "Is there a maximum span of control limit established in your agency policy for high-risk tactical operations?", orderIndex: 110 }
    ];
    
    // Span of Control Adjustments for Complex Operations
    const spanOfControlQuestions = [
      { text: "Does your agency policy allow for adjustments to the span of control based on the complexity of the operation?", orderIndex: 111 },
      { text: "In complex or large-scale operations, are additional supervisors or command staff assigned to support the SWAT team leadership?", orderIndex: 112 },
      { text: "Does your policy provide for the delegation of specific tasks to subordinate leaders or specialists to reduce the burden on the SWAT team commander?", orderIndex: 113 },
      { text: "Are command post personnel integrated into the span of control policy?", orderIndex: 114 }
    ];
    
    // Training and Evaluation of Leadership
    const trainingLeadershipQuestions = [
      { text: "Are team leaders and supervisors required to undergo leadership training specific to tactical environments?", orderIndex: 115 },
      { text: "Does your agency provide leadership development programs for SWAT supervisors to continuously improve their command and control skills?", orderIndex: 116 }
    ];
    
    // Equipment Procurement and Allocation
    const equipmentProcurementQuestions = [
      { text: "Does your agency have a formal, written policy for the procurement and allocation of tactical equipment for SWAT operations?", orderIndex: 117 },
      { text: "Is the equipment procurement process reviewed regularly to ensure that SWAT teams have access to the latest technology and tools?", orderIndex: 118 },
      { text: "Are equipment purchases approved through a dedicated budget, and are funding sources clearly identified?", orderIndex: 119 },
      { text: "Does your agency conduct regular assessments to ensure that SWAT teams are equipped with mission-specific gear?", orderIndex: 120 }
    ];
    
    // Equipment Maintenance and Inspection
    const equipmentMaintenanceQuestions = [
      { text: "Is there a formal maintenance policy in place that outlines the frequency and scope of inspections for all SWAT equipment?", orderIndex: 121 },
      { text: "Does your agency maintain detailed maintenance logs and records of repairs for all equipment used by the SWAT team?", orderIndex: 122 },
      { text: "Are there dedicated personnel or technicians assigned to oversee the maintenance and repair of specialized equipment?", orderIndex: 123 }
    ];
    
    // Equipment Inventory Management
    const inventoryManagementQuestions = [
      { text: "Does your agency have a centralized inventory management system to track all SWAT equipment?", orderIndex: 124 },
      { text: "Is there a process in place for issuing and returning equipment before and after SWAT operations?", orderIndex: 125 },
      { text: "Are inventory audits conducted on a regular basis to ensure all SWAT equipment is accounted for?", orderIndex: 126 },
      { text: "Does your inventory system include expiration tracking for time-sensitive equipment?", orderIndex: 127 }
    ];
    
    // Standard Operating Guidelines (SOGs)
    const sogQuestions = [
      { text: "Does your agency have written Standard Operating Procedures (SOPs) in place for all SWAT-related operations?", orderIndex: 128 },
      { text: "Are the SOPs reviewed and updated regularly to reflect changes in tactics, technology, legal standards, or best practices?", orderIndex: 129 },
      { text: "Do your SOPs outline specific protocols for common SWAT operations?", orderIndex: 130 },
      { text: "Are your SOPs accessible to all SWAT team members, including newly assigned personnel and support staff?", orderIndex: 131 },
      { text: "Are SWAT team members trained on the specific SOPs for each type of operation before deployment?", orderIndex: 132 },
      { text: "Do your SOPs include detailed guidance on the use of force, including lethal and less-lethal options?", orderIndex: 133 },
      { text: "Are there SOPs in place for interagency cooperation and mutual aid responses?", orderIndex: 134 },
      { text: "Does your agency conduct after-action reviews (AARs) for every operation?", orderIndex: 135 }
    ];
    
    // Combine all SOP questions
    const allSopQuestions = [
      ...teamStructureQuestions,
      ...supervisorRatioQuestions,
      ...spanOfControlQuestions,
      ...trainingLeadershipQuestions,
      ...equipmentProcurementQuestions,
      ...equipmentMaintenanceQuestions,
      ...inventoryManagementQuestions,
      ...sogQuestions
    ];
    
    // Update each SOP question in the database
    for (const questionData of allSopQuestions) {
      // Normalize the text for comparison (remove extra spaces, etc.)
      const normalizedText = questionData.text.trim().replace(/\s+/g, ' ');
      
      // Find questions that contain this text (allowing for partial matches using the first part of the text)
      const matchingQuestion = await db.select().from(questions).where(
        sql`LOWER(text) LIKE ${`%${normalizedText.toLowerCase().substring(0, Math.min(40, normalizedText.length))}%`}`
      );
      
      if (matchingQuestion.length > 0) {
        // Update the question with the new order index
        await db.update(questions)
          .set({ 
            orderIndex: questionData.orderIndex,
            // Also ensure the text matches exactly
            text: questionData.text
          })
          .where(eq(questions.id, matchingQuestion[0].id));
        
        console.log(`Updated SOP question: ${questionData.text.substring(0, 40)}... to order index ${questionData.orderIndex}`);
      } else {
        console.log(`⚠️ SOP Question not found: ${questionData.text.substring(0, 40)}...`);
      }
    }
    
    console.log("SOP questions have been updated with exact document ordering");
    
  } catch (error) {
    console.error("Error updating SOP questions:", error);
  }
}

// Run the update function
updateSopQuestions();