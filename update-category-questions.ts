import { db } from "./db";
import { questionCategories, questions } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Updates questions for a single category in the database
 * to match the official SWAT Tier Level Assessment Template
 */
async function updateCategoryQuestions(categoryId: string) {
  try {
    // Get the category details
    const category = await db.select().from(questionCategories).where(eq(questionCategories.id, categoryId)).limit(1);
    
    if (category.length === 0) {
      console.log(`Category with ID ${categoryId} not found`);
      return;
    }
    
    const categoryName = category[0].name;
    console.log(`Updating questions for category: ${categoryName} (${categoryId})`);
    
    // Define the mapping of categories to their questions
    const categoryQuestions: {[key: string]: { categoryName: string, questions: string[] }} = {
      "c1411a75-599f-49cf-a8b2-65e17db5f9ba": {
        categoryName: "Tier 1-4 Metrics (Personnel & Leadership)",
        questions: [
          "Do you have 34 or more total members on your team?",
          "Do you have 26-33 total members on your team?",
          "Do you have 18-25 total members on your team?",
          "Do you have 10-17 total members on your team?",
          "Does your team operate in three or more shifts?",
          "Does your team operate in two shifts?",
          "Does your team operate in a single shift?",
          "Do you have an assigned team commander?",
          "Do you have an assigned executive officer (XO)?",
          "Do you have an assigned team leader?",
          "Do you have an assigned assistant team leader?",
          "Do you have multiple dedicated element leaders?",
          "Do you have a sniper element leader?",
          "Do you have a chemical agent/less lethal element leader?",
          "Do you have a negotiations element coordinator?"
        ]
      },
      "3f137fcf-33c0-4d97-a4a4-7db2c28fc1c8": {
        categoryName: "Mission Profiles",
        questions: [
          "Do you maintain capability for high-risk warrant service operations?",
          "Do you maintain capability for armed barricaded subject (ABS) operations?",
          "Do you maintain capability for hostage rescue operations?",
          "Do you maintain capability for complex coordinated attacks such as those involving active shooters?",
          "Do you maintain capability for counter-sniper operations?",
          "Do you train and prepare for terrorist response operations?",
          "Do you train and conduct critical infrastructure protection?",
          "Do you train and conduct dignitary protection operations?",
          "Do you train or conduct man-tracking operations (rural/woodland)?"
        ]
      },
      "dbb503ba-0683-49a5-8de7-03f4603773b6": {
        categoryName: "Individual Operator Equipment",
        questions: [
          "Is each operator equipped with a primary handgun?",
          "Is each operator equipped with a primary carbine/rifle?",
          "Is each operator equipped with tactical body armor (level IIIA minimum)?",
          "Is each operator equipped with a ballistic helmet?",
          "Is each operator equipped with eye protection?",
          "Is each operator equipped with hearing protection?",
          "Is each operator equipped with standard load-bearing equipment (LBE) or tactical vest?",
          "Is each operator equipped with tactical communications equipment?",
          "Is each operator equipped with a gas mask?",
          "Is each operator equipped with a flashlight?",
          "Is each operator equipped with a uniform or identifier apparel?",
          "Do all your members have at least Level IIIA body armor & rifle plates?",
          "Do all operators have helmet-mounted white light systems?",
          "Do all operators have helmet-mounted IR light source?",
          "Do all operators have voice amplifiers for gas masks?",
          "Do all members have integrated communications (team-wide)?",
          "Do all operators have Level 2+ retention holsters?",
          "Do all operators have Night Vision (BNVD, Monocular, PANO)?"
        ]
      },
      "f3f0d9c4-d9fd-42e0-8df8-94e5bf93a1e5": {
        categoryName: "Sniper Equipment & Operations",
        questions: [
          "Do you have dedicated precision rifle platforms for snipers?",
          "Do you have dedicated spotting scopes for sniper operations?",
          "Do you have range finding equipment for sniper operations?",
          "Do you have environmental data gathering equipment (wind meters, etc.) for sniper operations?",
          "Do you have night vision capability for sniper operations?",
          "Do you maintain training records, lesson plans, and research selection processes for snipers?",
          "Do you maintain certifications, qualifications, and records of weapons modifications & ammo inventories?",
          "Do snipers have a hydration system?",
          "Do snipers have a long-range camera system?",
          "Do snipers have binoculars?",
          "Do snipers have a hands-free white light or low-visibility red/green/blue light?",
          "Does each sniper have night vision (BNVD, Monocular, PANO)?",
          "Do snipers maintain a logbook for maintenance & tracking rifle performance?",
          "Do snipers use magnified optics?",
          "Do snipers have clip-on night vision for magnified optics?",
          "Do snipers have an IR illuminator?",
          "Do snipers have an IR laser handheld for target identification?",
          "Are snipers equipped with ammunition capable of engagements through intermediate glass?"
        ]
      },
      "9420533e-af40-478c-8b8e-65b08e1f31ab": {
        categoryName: "Breaching Operations",
        questions: [
          "Do you have dedicated breaching personnel?",
          "Do you have mechanical breaching capabilities?",
          "Do you have ballistic breaching capabilities?",
          "Do you have explosive breaching capabilities?",
          "Do you conduct regular breaching training and certification?",
          "Does your team have manual breaching tools?",
          "Does your team have hydraulic breaching tools?",
          "Does your team have thermal/exothermic breaching capability?",
          "Does your team have break-and-rake tools?"
        ]
      },
      "1597467a-612f-437a-9de7-e86f9529cf6f": {
        categoryName: "Access & Elevated Tactics",
        questions: [
          "Does your team have individual rappel gear (ropes, bags, anchoring systems)?",
          "Does your team have variable-size ladders for 1st & 2nd story access?",
          "Does your team have bridging ladders for elevated horizontal or pitched access?",
          "Does your team have one-person portable ladders for sniper insertion?",
          "Does your team have small portable ladders (≤6ft for window porting, walls, and rescue operations)?",
          "Do you have specialized equipment for elevated entry?",
          "Do you have rappelling equipment and capability?",
          "Do you have training in helicopter insertion tactics?",
          "Do you train in elevated shooting platforms?",
          "Do you have policies governing operations in elevated environments?"
        ]
      },
      "7697e444-532a-4515-a8d5-a16cd428b4e0": {
        categoryName: "Less-Lethal Capabilities",
        questions: [
          "Do you have impact projectile systems?",
          "Do you have conducted energy weapons?",
          "Do you have specialized less-lethal launchers?",
          "Do you train all operators in less-lethal deployment?",
          "Do you have policies governing less-lethal use and deployment?",
          "Does your team have short-range energizing devices (Tasers)?",
          "Does your team have medium-range 12-gauge platform and munitions?",
          "Does your team have long-range 37/40mm platform and munitions?"
        ]
      },
      "a65cd14e-69a8-4acc-8f46-7c6b169c9a62": {
        categoryName: "Noise Flash Diversionary Devices (NFDDs)",
        questions: [
          "Do you have NFDDs available for operations?",
          "Do you have dedicated personnel trained in NFDD deployment?",
          "Do you conduct regular training in NFDD deployment?",
          "Do you have policies governing NFDD use and deployment?",
          "Do you have documentation of NFDD inventory and deployment?",
          "Does your team have single-use noise flash diversionary devices (NFDDs)?",
          "Does your team have bang pole systems for NFDD initiation?",
          "Does your team maintain training records, lesson plans, and selection processes for NFDDs?",
          "Does your team maintain records of certifications, inventory, and munition rotation?"
        ]
      },
      "c1191dc6-01ad-4af4-93fa-a99ac7f0350e": {
        categoryName: "Chemical Munitions",
        questions: [
          "Do you have CS/OC delivery systems?",
          "Do you have multiple deployment methods for chemical agents?",
          "Do you train all operators in chemical agent deployment?",
          "Do you have gas mask confidence training?",
          "Do you have policies governing chemical agent use and deployment?",
          "Does your team have short-range throwable OC/CS munitions?",
          "Does your team have smoke munitions?",
          "Does your team have extension pole-mounted OC/CS munitions?",
          "Does your team have medium-range 12-gauge OC/CS rounds?",
          "Does your team have medium-range 12-gauge barricade-penetrating rounds?",
          "Does your team have long-range 37/40mm Ferret OC/CS rounds?",
          "Does your team have long-range 37/40mm barricade-penetrating rounds?",
          "Does your team maintain certification, inventory tracking, and munition rotation records?"
        ]
      },
      "8e0106b2-9608-4ac0-b68a-bcf0bdbc31e5": {
        categoryName: "K9 Operations & Integration",
        questions: [
          "Do you have dedicated tactical K9 teams?",
          "Do your K9 handlers receive tactical team training?",
          "Do you integrate K9 into tactical planning?",
          "Do you conduct training for K9 integration with tactical operations?",
          "Do you have policies governing K9 use in tactical operations?",
          "Does your team have a K9 assigned or attached (with or without an MOU)?",
          "Is your K9 unit trained to work with the entry team?",
          "Is your K9 unit long-line search capable?",
          "Is your K9 unit off-line search capable?",
          "Is your K9 unit open-air search capable?",
          "Is your K9 unit camera-equipped?",
          "Is your K9 unit bomb-detection capable?",
          "Does your K9 unit maintain training records, lesson plans, and research selection processes?",
          "Does your K9 unit maintain records of certifications, qualifications, weapons modifications, and ammunition inventories?"
        ]
      },
      "f7efe965-38ce-458a-b6b0-508d6dd53cbf": {
        categoryName: "Explosive Ordnance Disposal (EOD) Support",
        questions: [
          "Do you have dedicated EOD support?",
          "Do your EOD technicians receive tactical team training?",
          "Do you integrate EOD into tactical planning?",
          "Do you conduct training for EOD integration with tactical operations?",
          "Do you have policies governing EOD integration in tactical operations?",
          "Is your team integrated with a bomb squad for operational capability?",
          "Does your team have the ability to integrate EOD personnel in support roles with the entry team?",
          "Does your team have EOD personnel that can support the entry team from a staging area?",
          "Does your team have the ability to call a neighboring agency for EOD support?",
          "Is your EOD team trained and prepared to provide support for render-safe operations (misfires)?"
        ]
      },
      "1fed3322-7f4f-4a66-828e-c5f7bedd3008": {
        categoryName: "Mobility, Transportation & Armor Support",
        questions: [
          "Do you have armored tactical vehicles?",
          "Do you have specialized transportation for tactical operations?",
          "Do you have a mobile command post?",
          "Do you have armored ballistic shields (Level III+)?",
          "Do you have specialized mobility equipment for tactical operations?",
          "Is your team assigned or does it own an armored vehicle (independent of an MOU)?",
          "If your team does not own an armored vehicle, do you have an MOU in place to secure one for a crisis?",
          "Can your armored vehicle carry at least 8 operators?",
          "Does your team have access to a second armored vehicle through an MOU?",
          "Is your armored vehicle rated for .50-caliber defense?",
          "Does your armored vehicle have camera capability?",
          "Does your armored vehicle have SCBA capability?",
          "Is your armored vehicle equipped with multiple shooting ports?",
          "Does your armored vehicle have tow and pull capability?",
          "Is your team assigned vehicles to move all personnel to a crisis site?",
          "Is your team assigned vehicles to move all necessary tactical equipment?"
        ]
      },
      "0d05ec4d-902f-4582-bf92-aae31017a4e6": {
        categoryName: "Unique Environment & Technical Capabilities",
        questions: [
          "Do you have underwater/maritime tactical capability?",
          "Do you have low-light/no-light operational capabilities?",
          "Do you have rural/woodland operational capabilities?",
          "Do you have tubular assault capabilities (aircraft, buses, trains)?",
          "Do you have thermal/infrared detection capabilities?",
          "Do you have drone/UAS capabilities?",
          "Do you have throw phone or remote communications capabilities?",
          "Do you have robot/remote reconnaissance capabilities?",
          "Do you have cellular intelligence capabilities?",
          "Do you have technical surveillance capabilities?",
          "Is your team trained in tactical tracking in urban environments?",
          "Is your team trained in land navigation?",
          "Is your team trained for integration with air support in woodland and open urban environments?",
          "Is your team trained for integration with drones in woodland and open urban environments?"
        ]
      },
      "c8d87078-a85b-4f20-b681-d26223ff2ca8": {
        categoryName: "SCBA & HAZMAT Capabilities",
        questions: [
          "Do you have SCBA equipment available for operations?",
          "Do all operators receive SCBA training?",
          "Do you conduct regular SCBA confidence and use training?",
          "Do you have policies for SCBA deployment and use?",
          "Do you have HAZMAT identification and response capabilities?",
          "Is your team equipped and trained with a PAPR (Powered Air-Purifying Respirator) system?",
          "Is your team equipped and trained with Self-Contained Breathing Apparatus (SCBA)?"
        ]
      },
      "74b73cd8-b277-485f-b5c7-d84ee4ff2a26": {
        categoryName: "Tactical Emergency Medical Support (TEMS)",
        questions: [
          "Do you have dedicated TEMS personnel for operations?",
          "Do your TEMS providers have tactical training?",
          "Do you integrate TEMS into operational planning?",
          "Do you have enhanced medical equipment available for operations?",
          "Do you conduct casualty evacuation training and planning?",
          "Are your tactical medics trained and equipped with basic and advanced medical capabilities based on the team's mission profiles?",
          "Does your team have access to a medical director who is on-call and able to provide onsite direction and support for tactical operations?",
          "Does your tactical medical element conduct ongoing training using core competencies of tactical medical care, including scenario-based training?",
          "Does each team member have an Individual First Aid Kit (IFAK) with tourniquets and hemostatic agents?",
          "Do your TEMS personnel maintain certifications in advanced trauma care (TCCC, TECC, or equivalent)?"
        ]
      }
    };

    // Check if this is a category we have predefined questions for
    if (!(categoryId in categoryQuestions)) {
      console.log(`No predefined questions found for category ID ${categoryId}`);
      return;
    }

    // Delete existing questions for this category
    await db.delete(questions).where(eq(questions.categoryId, categoryId));
    console.log(`Deleted existing questions for ${categoryName}`);
    
    // Add the new questions for this category
    const questionsToAdd = categoryQuestions[categoryId as keyof typeof categoryQuestions].questions;
    
    for (let i = 0; i < questionsToAdd.length; i++) {
      const questionText = questionsToAdd[i];
      
      await db.insert(questions).values({
        text: questionText,
        description: "Required for tiering",
        categoryId: categoryId,
        orderIndex: i + 1,
        questionType: "boolean",
        createdAt: new Date()
      });
    }
    
    console.log(`Added ${questionsToAdd.length} questions to ${categoryName}`);
    console.log(`Category ${categoryName} updated successfully!`);
    
    return questionsToAdd.length;
  } catch (error) {
    console.error("Error updating category questions:", error);
    throw error;
  }
}

// Main function to update a specific category
async function main() {
  const categoryId = process.argv[2];
  
  if (!categoryId) {
    console.error("Please provide a category ID as a command-line argument");
    process.exit(1);
  }

  try {
    await updateCategoryQuestions(categoryId);
    console.log("Category questions update successful!");
    process.exit(0);
  } catch (error) {
    console.error("Category questions update failed:", error);
    process.exit(1);
  }
}

export { updateCategoryQuestions };

// Run the main function if this is being run directly 
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}