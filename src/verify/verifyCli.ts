import { verifyDependabotJson } from "./verifyDependabotJson.js";

const jsonArg = process.argv.indexOf("--json");
const path = jsonArg >= 0 ? process.argv[jsonArg + 1] : "dependabot.json";
process.exit(verifyDependabotJson(path));
