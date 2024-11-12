import { db } from "$lib/database.js";

// @ts-ignore
export async function GET({ url }) {
  const prompt_id = url.searchParams.get("prompt_id");

  if (!prompt_id) {
    return new Response(
      JSON.stringify({
        message: "Prompt id needed to retrieve admin data",
      }),
      {
        status: 400,
      }
    );
  }

  console.log("PROMPT ID Retrieved from ADMINNNNNNNNNN:" + prompt_id);

  try {
    // Query to join Video, Comment, and Annotation tables based on the prompt_id
    const [rows] = await db.query(
      `SELECT 
        Prompt.prompt_type,
        Video.url AS video_url, 
        Video.description AS description, 
        Video.transcript AS transcript, 
        Comment.text AS comment, 
        Annotation.true_value, 
        Annotation.predicted_value, 
        Annotation.annotation_id 
       FROM Prompt
       JOIN PromptWriter ON Prompt.writer_id = PromptWriter.id
       JOIN Video ON Prompt.prompt_id = Video.prompt_id
       JOIN Comment ON Video.video_id = Comment.video_id 
       JOIN Annotation ON Comment.comment_id = Annotation.comment_id 
       WHERE Annotation.prompt_id = ? `,
      [prompt_id]
    );

    // @ts-ignore
    // console.log("Sample of admin data:", rows.slice(0, 5));
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (error) {
    console.error("Error fetching examples:", error);
    return new Response(
      JSON.stringify({ message: "Failed to retrieve data" }),
      { status: 500 }
    );
  }
}
