const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');

const target = `totalAmount   Float    @default(0)
  zakatType     String   @default("FITRAH") // "FITRAH" or "HARTA"`;
const replace = `totalAmount   Float    @default(0)
  zakatType     String   @default("FITRAH") // "FITRAH" or "HARTA"
  
  isSedekah     Boolean  @default(false)
  paidAmount    Float    @default(0)
  sedekahAmount Float    @default(0)`;

if (c.includes(target)) {
  c = c.replace(target, replace);
  fs.writeFileSync('prisma/schema.prisma', c);
  console.log("Success updating schema");
} else {
  console.log("Target not found");
}
