import { db } from "$lib/database.js"; // Ensure this file provides a MySQL connection with transaction support
import { exec } from "child_process"; // To run CLI commands
import path from "path";
import { get } from "svelte/store";

import fs from "fs";
import fetch from "node-fetch";
import OpenAI, { toFile } from "openai";
import {
  waitingForAnnotation,
  pendingPrompt,
  selectedAnnotationType,
  userId,
  userName,
  prompts,
  latestProgress,
} from "$lib/stores";
import { faQuestion } from "@fortawesome/free-solid-svg-icons";

// Set the OpenAI API key
const apiKey = "";

const openai = new OpenAI({
  apiKey,
});

/**
 * @param {string} responseText
 */
function parseResponse(responseText) {
  const lowerResponse = responseText
    .replace(/[\[\]]/g, "")
    .toLowerCase()
    .trim();

  if (["yes", "true", "1"].includes(lowerResponse)) {
    return "true";
  } else if (["no", "false", "0", "vague"].includes(lowerResponse)) {
    return "false";
  } else {
    // Log a warning about the unexpected response
    console.warn(
      `Warning: Unexpected response format: '${responseText}'. Expected 'Yes' or 'No'. Defaulting to 'false'.`
    );
    // Return the default value 'false'
    return "false";
  }
}

/**
 * @param {any[]} dataset
 * @param {fs.PathOrFileDescriptor} outputPath
 * @param {any} system_prompt
 * @param {undefined} [question]
 */
async function saveToJSONL(dataset, outputPath, system_prompt, question) {
  const formattedData = dataset.map((item, index) => {
    // Ensure all fields are strings
    // const prompt = item.text ? String(item.text) : "";
    const description = item.description ? String(item.description) : "";
    const transcript = item.transcript ? String(item.transcript) : "";
    const comment = item.comment ? String(item.comment) : "";
    const true_value = item.true_value ? "Yes" : "No";
    // console.log("Custom prompt for JSON:" + question);

    // Debugging: Log if true_value is not a string
    if (typeof true_value !== "string") {
      console.error(
        `Item at index ${index} has non-string true_value:`,
        true_value
      );
    }

    return {
      messages: [
        {
          role: "system",
          content: system_prompt,
        },
        {
          role: "user",
          content: `Prompt for annotation: ${question}\nVideo description: ${description}\nTranscript: ${transcript}\nComment: ${comment}`,
        },
        { role: "assistant", content: true_value },
      ],
    };
    // }
  });

  // Write to a JSONL file
  const jsonlData = formattedData
    .map((entry) => JSON.stringify(entry))
    .join("\n");

  try {
    fs.writeFileSync(outputPath, jsonlData, "utf-8");
    console.log(`File saved successfully at ${outputPath}`);
  } catch (error) {
    console.error(`Error saving JSONL file at ${outputPath}:`, error);
  }
}

/**
 * @param {string} fineTuneJobId
 */
async function pollFineTuningJobStatus(fineTuneJobId) {
  const pollInterval = 60000; // 60 seconds
  const maxRetries = 60; // Maximum number of retries (1 hour)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const jobStatusResponse = await openai.fineTuning.jobs.retrieve(
        fineTuneJobId
      );
      const jobStatus = jobStatusResponse.status;

      console.log(
        `Polling attempt ${attempt + 1}: Job status is '${jobStatus}'`
      );

      latestProgress.set("fine tuning job " + jobStatus);
      console.log(`Latest progress set to${get(latestProgress)}`);

      if (jobStatus === "succeeded") {
        console.log("Fine-tuning completed successfully.");
        const fineTunedModel = jobStatusResponse.fine_tuned_model; // The name of the fine-tuned model
        return fineTunedModel;
      } else if (jobStatus === "failed") {
        console.error("Fine-tuning failed:", jobStatusResponse);

        // Retrieve and log the events
        const eventsResponse = await openai.fineTuning.jobs.listEvents(
          fineTuneJobId
        );
        const events = eventsResponse.data;
        console.error("Fine-tuning job events:");
        events.forEach((event) => {
          console.error(
            `[${event.created_at}] ${event.level}: ${event.message}`
          );
        });

        return null;
      } else {
        // You might also want to log partial progress or any warnings
        const events = await openai.fineTuning.jobs.listEvents(fineTuneJobId);
        console.log("Fine-tuning job events:", events);
      }
    } catch (error) {
      console.error("Error retrieving fine-tuning job status:", error);
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  console.error("Fine-tuning polling timed out.");
  return null;
}

/**
 * Retrieve the fine-tuned model name for a given writer_id
 * @param {number} writer_id - The ID of the writer
 * @returns {Promise<string | null>} The model name or null if not found
 * @param {{ query: (arg0: string, arg1: number[]) => PromiseLike<[any]> | [any]; }} connection
 */
async function getFineTunedModelName(connection, writer_id) {
  const [rows] = await connection.query(
    `SELECT model_name FROM FineTunedModels WHERE writer_id = ? ORDER BY created_at DESC LIMIT 1`,
    [writer_id]
  );

  if (rows.length > 0) {
    return rows[0].model_name;
  } else {
    console.warn(`No fine-tuned model found for writer_id: ${writer_id}`);
    return null;
  }
}

// Main function
// @ts-ignore
export async function POST({ request }) {
  const {
    trainingSet,
    // validationSet,
    testSet,
    question,
    system_prompt,
    $prompts,
    prompt_type,
    writer_id,
  } = await request.json();
  let connection;
  console.log("QUESSSSS reveived in server:" + question);
  console.log("IN SERVER RECEIVED:" + prompt_type + writer_id);

  try {
    // Begin a transaction to ensure all inserts are either fully completed or rolled back in case of an error
    connection = await db.getConnection();

    await connection.beginTransaction();

    latestProgress.set("starting");
    await saveToJSONL(
      trainingSet,
      "training_data.jsonl",
      system_prompt,
      question
    );
    // await saveToJSONL(validationSet, "validation_data.jsonl", system_prompt);

    // Upload the training file
    const trainingUploadResponse = await openai.files.create({
      file: fs.createReadStream("training_data.jsonl"),
      purpose: "fine-tune",
    });

    console.log("Training file uploaded:", trainingUploadResponse);

    // Upload the validation file
    // const validationUploadResponse = await openai.files.create({
    //   file: fs.createReadStream("validation_data.jsonl"),
    //   purpose: "fine-tune",
    // });

    // console.log("Validation file uploaded:", validationUploadResponse);

    // Create the fine-tuning job
    const fineTuneResponse = await openai.fineTuning.jobs.create({
      training_file: trainingUploadResponse.id,
      // validation_file: validationUploadResponse.id,
      model: "gpt-4o-mini-2024-07-18",
      hyperparameters: {
        n_epochs: 3,
        batch_size: 128,
      },
    });

    console.log("Fine-tuning job created:", fineTuneResponse);

    const fineTuneJobId = fineTuneResponse.id;

    // Poll for job status
    const fineTunedModelName = await pollFineTuningJobStatus(fineTuneJobId);

    if (!fineTunedModelName) {
      latestProgress.set("fine-tuning failed or timed out");
      throw new Error("Fine-tuning failed or timed out");
    }

    // console.log("Fine-tuned model name:", fineTunedModelName);

    // // Insert the mapping into the FineTunedModels table
    // await connection.query(
    //   `INSERT INTO FineTunedModels (writer_id, model_name, created_at) VALUES (?, ?, NOW())`,
    //   [writer_id, fineTunedModelName]
    // );
    // // }

    latestProgress.set("annotating");
    console.log("QUESTION THIS TIME:" + question);
    // 1. Insert into Prompt (only once for the entire batch)
    const [promptResult] = await connection.query(
      `INSERT INTO Prompt (text, prompt_type, time_submitted, writer_id) VALUES (?, ?, NOW(), ?)`,
      [question, prompt_type, writer_id]
    );
    // @ts-ignore
    const newPromptId = promptResult.insertId;
    console.log("New Prompt ID:", newPromptId);

    const videoMap = new Map();

    for (const item of testSet) {
      const {
        prompt_type,
        video_url,
        description,
        transcript,
        comment,
        true_value,
        original_pred,
        original_annotation_id,
      } = item;

      let responseContent;
      let predicted_value;

      // Construct the base prompt with video and comment information
      const base_prompt = `Video description: ${description}\n Video transcription: ${transcript}\n Question: ${question}\n Comment: ${comment}`;
      const messages = [
        { role: "system", content: system_prompt },
        { role: "user", content: base_prompt },
      ];

      // Call OpenAI API and retry if needed
      let retries = 3;
      while (retries > 0) {
        try {
          // @ts-ignore
          const gptResponse = await openai.chat.completions.create({
            model: fineTunedModelName,
            // @ts-ignore
            messages: messages,
            temperature: 0,
          });

          // @ts-ignore
          responseContent = gptResponse.choices[0].message.content.trim();
          predicted_value = parseResponse(responseContent);
          retries = 0;

          // Check if choices array is present
          if (
            !gptResponse.choices ||
            !gptResponse.choices[0] ||
            !gptResponse.choices[0].message
          ) {
            console.error(
              "Unexpected OpenAI API response format:",
              gptResponse
            );
            throw new Error(
              "OpenAI API response did not contain expected 'choices' data."
            );
          }
        } catch (error) {
          console.error("Error calling OpenAI API:", error);
          if (--retries === 0) throw error;
          await new Promise((resolve) => setTimeout(resolve, 150000)); // Retry after delay
        }
      }

      const videoKey = `${video_url}_${newPromptId}`;
      let videoId;
      // 2. Insert into Video
      if (videoMap.has(videoKey)) {
        // Use the existing video_id if we have already inserted this video with the same prompt
        videoId = videoMap.get(videoKey);
      } else {
        // 2. Insert into Video (only once per unique video URL and prompt ID combination)
        const [videoResult] = await connection.query(
          `INSERT INTO Video (url, description, transcript, source, prompt_id) VALUES (?, ?, ?, ?, ?)`,
          [video_url, description, transcript, "YouTube", newPromptId]
        );
        // @ts-ignore
        videoId = videoResult.insertId;
        videoMap.set(videoKey, videoId); // Store video_id to avoid duplicate inserts
        console.log(
          "New Video ID:",
          videoId,
          "for URL:",
          video_url,
          "and Prompt ID:",
          newPromptId
        );
      }

      // 3. Insert into Comment
      const [commentResult] = await connection.query(
        `INSERT INTO Comment (text, video_id, prompt_id) VALUES (?, ?, ?)`,
        [comment, videoId, newPromptId]
      );
      // @ts-ignore
      const newCommentId = commentResult.insertId;

      // 4. Insert into Annotation
      const booleanPredictedValue = predicted_value === "true" ? 1 : 0;
      await connection.query(
        `INSERT INTO Annotation (true_value, predicted_value, comment_id, prompt_id) VALUES (?, ?, ?, ?)`,
        [true_value, booleanPredictedValue, newCommentId, newPromptId]
      );
      console.log(
        "INSERTED:" + true_value + booleanPredictedValue + predicted_value
      );
    }

    // Commit the transaction after successfully inserting all records
    await connection.commit();
    // @ts-ignore
    // waitingForAnnotation.set(false);
    // pendingPrompt.set(null);

    return new Response(
      JSON.stringify({
        message: "Data processed and saved to database successfully",
        prompt_id: newPromptId,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing data:", error);

    // Rollback transaction in case of an error to maintain data integrity
    // @ts-ignore
    await connection.rollback();

    return new Response(JSON.stringify({ message: "Failed to process data" }), {
      status: 500,
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ progress: get(latestProgress) }), {
    status: 200,
  });
}
