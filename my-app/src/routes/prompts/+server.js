import { db } from "$lib/database.js";

// @ts-ignore
export async function GET({ url }) {
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ message: "User ID is required" }), {
      status: 400,
    });
  }

  try {
    // Query to get prompts for the given user ID
    const [rows] = await db.query(
      "SELECT prompt_id, text, prompt_type, time_submitted, metrics FROM Prompt WHERE writer_id = ?",
      [userId]
    );

    // console.log("GET request for prompts went thruUUUUUUUU");

    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return new Response(
      JSON.stringify({ message: "Failed to retrieve prompts" }),
      { status: 500 }
    );
  }
}
