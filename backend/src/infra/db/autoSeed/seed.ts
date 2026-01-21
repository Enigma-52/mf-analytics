import { db } from "../index";
import { funds } from "../schema";

const SEED_FUNDS = [
  // Mid Cap Direct Growth
  {
    code: "118989",
    name: "HDFC Mid Cap Fund - Growth Option - Direct Plan",
    amc: "HDFC",
    category: "Mid Cap Direct Growth",
  },
  {
    code: "120505",
    name: "Axis Midcap Fund - Direct Plan - Growth",
    amc: "Axis",
    category: "Mid Cap Direct Growth",
  },
  {
    code: "119716",
    name: "SBI MIDCAP FUND - DIRECT PLAN - GROWTH",
    amc: "SBI",
    category: "Mid Cap Direct Growth",
  },
  {
    code: "120381",
    name: "ICICI Prudential MidCap Fund - Direct Plan - Growth",
    amc: "ICICI",
    category: "Mid Cap Direct Growth",
  },
  {
    code: "119775",
    name: "Kotak Midcap Fund - Direct Plan - Growth",
    amc: "Kotak",
    category: "Mid Cap Direct Growth",
  },

  // Small Cap Direct Growth
  {
    code: "120591",
    name: "ICICI Prudential Smallcap Fund - Direct Plan - Growth",
    amc: "ICICI",
    category: "Small Cap Direct Growth",
  },
  {
    code: "130503",
    name: "HDFC Small Cap Fund - Growth Option - Direct Plan",
    amc: "HDFC",
    category: "Small Cap Direct Growth",
  },
  {
    code: "125354",
    name: "Axis Small Cap Fund - Direct Plan - Growth",
    amc: "Axis",
    category: "Small Cap Direct Growth",
  },
  {
    code: "125497",
    name: "SBI Small Cap Fund - Direct Plan - Growth",
    amc: "SBI",
    category: "Small Cap Direct Growth",
  },
  {
    code: "120164",
    name: "Kotak-Small Cap Fund - Growth - Direct",
    amc: "Kotak",
    category: "Small Cap Direct Growth",
  },
];

export async function runSeed() {
  await db.insert(funds).values(SEED_FUNDS).onConflictDoNothing();
  console.log("Seed completed");
}