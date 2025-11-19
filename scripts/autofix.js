import OpenAI from "openai";
import fs from "fs";
import "dotenv/config";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const issueTitle = process.argv[2];
const issueBody = process.argv[3];

async function run() {
  const prompt = `
Tu es un outil de correction de bugs. 
Réponds UNIQUEMENT avec un patch git au format unified diff.
N'ajoute pas de texte avant ou après.

Issue :
Titre : ${issueTitle}
Description : ${issueBody}
  `;

  const res = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const patch = res.choices[0].message.content;
  fs.writeFileSync("autofix.patch", patch);
  console.log("Patch AI généré ✅");
}

run();