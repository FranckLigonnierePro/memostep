import fs from "fs";

const issueTitle = process.argv[2];
const issueBody = process.argv[3];

// Ici tu appelleras l'IA.
// Pour l'instant on met un placeholder :
const correction = `// Correction IA prévue ici
// Issue: ${issueTitle}
`;

fs.writeFileSync("autofix.txt", correction);
console.log("Fichier créé");
