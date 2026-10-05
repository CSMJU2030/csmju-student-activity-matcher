/**
 * Idempotent seed for the interest catalog: categories, interests and
 * looking-for options (same catalog as the MIS prototype).
 *
 * Run: npm run prisma:seed:interests
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ── Interest Categories ─────────────────────────────────────
const CATEGORIES = [
  { name: "Games",           icon: "🎮", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "Sports",          icon: "⚽", color: "bg-green-100 text-green-700 border-green-200" },
  { name: "Music",           icon: "🎵", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { name: "Programming",     icon: "👨‍💻", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { name: "Technology",      icon: "💻", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { name: "Movies & Series", icon: "🎬", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { name: "Hobbies",         icon: "🎨", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { name: "Other",           icon: "✨", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

// ── Interests per category ──────────────────────────────────
const INTERESTS: Record<string, { name: string; icon: string }[]> = {
  Games: [
    { name: "Valorant",           icon: "🎮" },
    { name: "Minecraft",          icon: "⛏️" },
    { name: "Roblox",             icon: "🧱" },
    { name: "Genshin Impact",     icon: "✨" },
    { name: "League of Legends",  icon: "⚔️" },
    { name: "PUBG",               icon: "🔫" },
    { name: "Mobile Legends",     icon: "📱" },
    { name: "Overwatch",          icon: "🛡️" },
    { name: "Counter-Strike",     icon: "💣" },
    { name: "ROV",                icon: "🏰" },
    { name: "Game Development",   icon: "🕹️" },
  ],
  Sports: [
    { name: "Badminton",     icon: "🏸" },
    { name: "Football",      icon: "⚽" },
    { name: "Basketball",    icon: "🏀" },
    { name: "Volleyball",    icon: "🏐" },
    { name: "Running",       icon: "🏃" },
    { name: "Swimming",      icon: "🏊" },
    { name: "Table Tennis",  icon: "🏓" },
    { name: "Fitness",       icon: "💪" },
  ],
  Music: [
    { name: "Pop",     icon: "🎤" },
    { name: "Rock",    icon: "🎸" },
    { name: "Hip Hop", icon: "🎧" },
    { name: "K-Pop",   icon: "🇰🇷" },
    { name: "J-Pop",   icon: "🇯🇵" },
    { name: "Guitar",  icon: "🎸" },
    { name: "Piano",   icon: "🎹" },
  ],
  Programming: [
    { name: "Python",                icon: "🐍" },
    { name: "Java",                  icon: "☕" },
    { name: "JavaScript",            icon: "🟨" },
    { name: "TypeScript",            icon: "🔷" },
    { name: "C++",                   icon: "⚙️" },
    { name: "C#",                    icon: "🟢" },
    { name: "PHP",                   icon: "🐘" },
    { name: "Web Development",       icon: "🌐" },
    { name: "Backend Development",   icon: "🖥️" },
    { name: "Frontend Development",  icon: "🎨" },
  ],
  Technology: [
    { name: "Artificial Intelligence", icon: "🤖" },
    { name: "Machine Learning",        icon: "🧠" },
    { name: "Cybersecurity",           icon: "🔒" },
    { name: "Cloud Computing",         icon: "☁️" },
    { name: "Linux",                   icon: "🐧" },
    { name: "Robotics",               icon: "🦾" },
    { name: "Data Science",            icon: "📊" },
    { name: "Mobile Development",      icon: "📱" },
  ],
  "Movies & Series": [
    { name: "Marvel",           icon: "🦸" },
    { name: "DC",               icon: "🦇" },
    { name: "Anime",            icon: "🎌" },
    { name: "Harry Potter",     icon: "⚡" },
    { name: "Game of Thrones",  icon: "👑" },
    { name: "Lord of the Rings",icon: "💍" },
    { name: "Star Wars",        icon: "⭐" },
    { name: "Movies",           icon: "🎬" },
    { name: "Series",           icon: "📺" },
  ],
  Hobbies: [
    { name: "Photography",   icon: "📷" },
    { name: "Drawing",       icon: "✏️" },
    { name: "Reading",       icon: "📖" },
    { name: "Cooking",       icon: "🍳" },
    { name: "Traveling",     icon: "✈️" },
    { name: "Arts & Crafts", icon: "🎨" },
  ],
  Other: [
    { name: "Mathematics", icon: "📐" },
    { name: "English",     icon: "🔤" },
    { name: "Research",    icon: "🔬" },
  ],
};

// ── Looking For Options ─────────────────────────────────────
const LOOKING_FOR = [
  { label: "หาเพื่อนเล่นเกม",       icon: "🎮" },
  { label: "หาเพื่อนเล่นกีฬา",      icon: "⚽" },
  { label: "หาเพื่อนเรียน",          icon: "📚" },
  { label: "หาเพื่อนทำโปรเจกต์",    icon: "💻" },
  { label: "ทำกิจกรรม",              icon: "🎉" },
  { label: "หาเพื่อนคุย",            icon: "💬" },
  { label: "อื่น ๆ",                  icon: "✨" },
];

async function seed() {
  console.log("🌱 Seeding interest categories...");

  // Upsert categories
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const existingCat = await prisma.interestCategory.findFirst({
      where: { name: cat.name }
    });
    let catId = "";

    if (existingCat) {
       const updated = await prisma.interestCategory.update({
         where: { id: existingCat.id },
         data: { icon: cat.icon, color: cat.color }
       });
       catId = updated.id;
    } else {
       const created = await prisma.interestCategory.create({
         data: { name: cat.name, icon: cat.icon, color: cat.color }
       });
       catId = created.id;
    }
    categoryMap[cat.name] = catId;
  }
  console.log(`  ✅ ${CATEGORIES.length} categories`);

  // Upsert interests
  let interestCount = 0;
  for (const [categoryName, interests] of Object.entries(INTERESTS)) {
    const categoryId = categoryMap[categoryName];
    if (!categoryId) {
      console.error(`  ❌ Category not found: ${categoryName}`);
      continue;
    }
    for (const interest of interests) {
      const nameLower = interest.name.trim().toLowerCase();
      
      const existing = await prisma.interest.findUnique({
        where: { nameLower }
      });

      if (existing) {
         await prisma.interest.update({
           where: { id: existing.id },
           data: { name: interest.name, icon: interest.icon, categoryId }
         });
      } else {
         await prisma.interest.create({
           data: {
             name: interest.name,
             nameLower: nameLower,
             icon: interest.icon,
             categoryId,
           }
         });
      }
      interestCount++;
    }
  }
  console.log(`  ✅ ${interestCount} interests`);

  // Upsert looking-for options
  for (const lf of LOOKING_FOR) {
    const existingOption = await prisma.lookingForOption.findFirst({
      where: { label: lf.label }
    });

    if (existingOption) {
      await prisma.lookingForOption.update({
        where: { id: existingOption.id },
        data: { icon: lf.icon }
      });
    } else {
      await prisma.lookingForOption.create({
        data: { label: lf.label, icon: lf.icon }
      });
    }
  }
  console.log(`  ✅ ${LOOKING_FOR.length} looking-for options`);

  console.log("🎉 Seed complete!");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
