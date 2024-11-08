import openai from "openai";
import fs from "fs";
import path from "path";

// Set the OpenAI API key
// @ts-ignore
const apiKey = "";

/**
 * Parses the OpenAI response text to a lowercase string "true" or "false" value.
 * @param {string} responseText - The text response from OpenAI.
 * @returns {string} - `"true"` if the response suggests affirmative action, `"false"` otherwise.
 */
function parseResponse(responseText) {
  const lowerResponse = responseText.toLowerCase().trim();

  // Log the response text for debugging
  console.log("OpenAI Response:", lowerResponse);

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
  const { data, question, system_prompt, output_file } = await request.json();
  const outputPath = path.join(process.cwd(), "static/exports", output_file);

  try {
    // Loop through each item in data
    for (const item of data) {
      const {
        prompt_type,
        video_url,
        description,
        transcript,
        comment,
        true_value,
        annotation_id,
      } = item;

      // Construct the base prompt with video and comment information
      const base_prompt = `Video description: ${description}\n Video transcription: ${transcript}\n Question: ${question}\n Comment: ${comment}`;

      const messages = [
        { role: "system", content: system_prompt },
        { role: "user", content: base_prompt },
      ];

      let retries = 3;
      let responseContent;

      while (retries > 0) {
        try {
          // Use fetch to directly call the OpenAI API
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4", // Adjust model name if necessary
                messages: messages,
                temperature: 0.2,
              }),
            }
          );

          const gptResponse = await response.json();
          responseContent = gptResponse.choices[0].message.content.trim();
          retries = 0; // Exit the retry loop if successful
        } catch (error) {
          console.error("Error calling OpenAI API:", error);
          if (retries > 1) {
            retries -= 1;
            await new Promise((resolve) => setTimeout(resolve, 150000)); // Wait 150 seconds before retrying
          } else {
            throw error; // Rethrow error if no retries left
          }
        }
      }

      console.log(responseContent);

      // Parse the response to determine the predicted value
      const predicted_value = parseResponse(responseContent);

      // Write the response to the output file in a structured format
      fs.appendFileSync(outputPath, `Annotation ID: ${annotation_id}\n`);
      fs.appendFileSync(outputPath, `Video URL: ${video_url}\n`);
      fs.appendFileSync(outputPath, `Comment: ${comment}\n`);
      fs.appendFileSync(outputPath, `True Value: ${true_value}\n`);
      fs.appendFileSync(outputPath, `Predicted Value: ${predicted_value}\n\n`);
    }

    return new Response(
      JSON.stringify({ message: "Data sent to OpenAI successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing data:", error);
    return new Response(JSON.stringify({ message: "Failed to process data" }), {
      status: 500,
    });
  }
}
