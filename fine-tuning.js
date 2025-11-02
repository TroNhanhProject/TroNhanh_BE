import OpenAI from "openai";
import fs from "fs";
import "dotenv/config"; 
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function upload() {
  const file = await client.files.create({
    file: fs.createReadStream("training_data.jsonl"),
    purpose: "fine-tune",
  });
  console.log("Uploaded file ID:", file.id);

  const fineTune = await client.fineTuning.jobs.create({
    training_file: file.id,
    model: "gpt-4o-mini", // hoặc "gpt-3.5-turbo"
  });

  console.log("Fine-tuning job:", fineTune.id);
}

upload();
