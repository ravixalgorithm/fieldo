#!/usr/bin/env npx tsx
import path from "node:path";
import { seedDemo, DEMO_ACCOUNT } from "../lib/seed-demo";

process.chdir(path.join(__dirname, ".."));

const fresh = !process.argv.includes("--no-fresh");

console.log("Seeding Fieldo demo workspace…\n");
const result = seedDemo({ fresh });

console.log("Demo account");
console.log(`  URL:      http://localhost:3210/login`);
console.log(`  Email:    ${DEMO_ACCOUNT.email}`);
console.log(`  Password: ${DEMO_ACCOUNT.password}`);
console.log(`  Workspace: ${DEMO_ACCOUNT.workspaceName}\n`);
console.log("Screens to review");
console.log(`  Command center:  http://localhost:3210/`);
console.log(`  Forms library:   http://localhost:3210/forms`);
console.log(`  Waitlist inbox:  http://localhost:3210/forms/${result.forms.waitlist}/inbox`);
console.log(`  Waitlist editor: http://localhost:3210/forms/${result.forms.waitlist}`);
console.log(`  Analytics:       http://localhost:3210/forms/${result.forms.waitlist}/analytics`);
console.log(`  Settings / keys: http://localhost:3210/settings`);
console.log(`  Live form:       http://localhost:3210/f/product-waitlist`);
console.log("\nDone.");
