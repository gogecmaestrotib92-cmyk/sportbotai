import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const reviews = await prisma.toolReview.findMany({
    where: { outreachSentAt: { gte: new Date("2026-02-02") } },
    orderBy: { outreachSentAt: "desc" },
    select: { toolName: true, contactEmail: true, outreachStatus: true, outreachSentAt: true, blogSlug: true }
  });
  console.log("Today's sent outreach (" + reviews.length + "):");
  reviews.forEach(r => console.log("  " + r.toolName + " -> " + r.contactEmail + " | " + r.blogSlug));
  await prisma.$disconnect();
}
main();
