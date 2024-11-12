import openai from "openai";
import { db } from "$lib/database.js"; // Ensure this file provides a MySQL connection with transaction support

// Set the OpenAI API key
const apiKey = "";

/**
 * Parses the OpenAI response text to "true" or "false" as a string.
 * @param {string} responseText - The text response from OpenAI.
 * @returns {string} - `"true"` if affirmative, `"false"` otherwise.
 */
function parseResponse(responseText) {
  const lowerResponse = responseText.toLowerCase().trim();

  if (["yes", "true", "1"].includes(lowerResponse)) {
    return "true";
  } else if (["no", "false", "0"].includes(lowerResponse)) {
    return "false";
  } else {
    throw new Error(
      `Unexpected response format: ${responseText}. Expected 'Yes' or 'No'.`
    );
  }
}

// @ts-ignore
export async function POST({ request }) {
  const { data, question, system_prompt, prompt_type, writer_id } =
    await request.json();
  let connection;
  console.log("IN SERVER RECEIVED:" + prompt_type + writer_id);

  try {
    // Begin a transaction to ensure all inserts are either fully completed or rolled back in case of an error
    connection = await db.getConnection();

    await connection.beginTransaction();

    // 1. Insert into Prompt (only once for the entire batch)
    const [promptResult] = await connection.query(
      `INSERT INTO Prompt (text, prompt_type, time_submitted, writer_id) VALUES (?, ?, NOW(), ?)`,
      [question, prompt_type, writer_id]
    );
    // @ts-ignore
    const newPromptId = promptResult.insertId;
    console.log("New Prompt ID:", newPromptId);

    const videoMap = new Map();

    // Loop through each item in data, each representing a set of related prompt, video, comment, and annotation data
    for (const item of data) {
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
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: messages,
                temperature: 0,
              }),
            }
          );

          const gptResponse = await response.json();
          console.log(gptResponse);
          // responseContent = gptResponse.choices[0].message.content.trim();
          // predicted_value = parseResponse(responseContent);
          // retries = 0;

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
      // const [videoResult] = await connection.query(
      //   `INSERT INTO Video (url, description, transcript, prompt_id) VALUES (?, ?, ?, ?)`,
      //   [video_url, description, transcript, newPromptId]
      // );
      // // @ts-ignore
      // const newVideoId = videoResult.insertId;

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
      await connection.query(
        `INSERT INTO Annotation (true_value, predicted_value, comment_id, prompt_id) VALUES (?, ?, ?, ?)`,
        [true_value, predicted_value, newCommentId, newPromptId]
      );
    }

    // Commit the transaction after successfully inserting all records
    await connection.commit();

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
