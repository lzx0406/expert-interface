<script>
  // @ts-nocheck

  import { writable } from "svelte/store";
  import { get } from "svelte/store";
  import { setContext } from "svelte";
  import { onMount, onDestroy } from "svelte";

  import { getContext } from "svelte";
  import Fa from "svelte-fa";
  import {
    faChevronLeft,
    faChevronRight,
    faChevronDown,
    faHouse,
  } from "@fortawesome/free-solid-svg-icons";

  import {
    selectedAnnotationType,
    userId,
    userName,
    prompts,
  } from "$lib/stores";

  let promptList = [];
  let prompt_id, text, prompt_type, time_submitted, metrics;
  let adminData, admin_p_id;
  let waitingForAnnotation = false;
  let timeElapsed = 0;
  let minutes, seconds, formattedTime;
  let interval;

  // Fetch past prompts for the logged-in user on component mount
  onMount(() => {
    fetchPastPrompts();
  });

  // Backend function to handle fetching prompts with metrics
  async function fetchPastPrompts() {
    const userIdValue = get(userId); // Get the latest value of userId

    if (!userIdValue) {
      console.error("User ID is missing");
      return;
    }

    try {
      // Fetch prompts for the user
      const response = await fetch(`/prompts?userId=${userIdValue}`);

      if (response.ok) {
        const data = await response.json();

        // Process each prompt to ensure metrics are available
        const updatedPrompts = data.map((prompt) => {
          // Parse the metrics field if it is stored as JSON
          if (typeof prompt.metrics === "string") {
            try {
              prompt.metrics = JSON.parse(prompt.metrics);
            } catch (error) {
              console.error("Error parsing metrics JSON:", error);
            }
          }
          return prompt;
        });

        // Update the prompts store with the updated data containing metrics
        prompts.set(updatedPrompts);

        console.log("Updated prompts with metrics:", updatedPrompts);
      } else {
        console.error("Failed to fetch prompts");
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
    }
  }

  //fetch admin data
  onMount(async () => {
    console.log("HEREEEEEE" + $selectedAnnotationType);
    if ($selectedAnnotationType === "call to action") {
      admin_p_id = 1;
    } else if ($selectedAnnotationType === "concern wildlife") {
      admin_p_id = 2;
    } else admin_p_id = 0;
    try {
      // Fetch data from the backend
      const response = await fetch(`/api/getAdminData?prompt_id=${admin_p_id}`);
      if (response.ok) {
        adminData = await response.json();
        console.log("Found admin data for type" + $selectedAnnotationType);
      } else {
        console.error("Failed to fetch admin data");
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  });

  let system_prompt = `
    You are an assistant specializing in video content analysis and annotation.
    You will be given descriptions, transcriptions, and comments on YouTube videos.
    Your task is to answer the following question based solely on the provided information:

    Does this comment on the video contain ${selectedAnnotationType}?

    Respond with a single word: either "Yes" or "No" only.

    Format your response EXACTLY as follows:
    [Yes / No]

    Do not add any explanations, comments, or additional information.
  `;

  let output_file = "openai_responses.csv"; // Define the output file name

  async function sendPrompt(question) {
    // Retrieve the latest values from Svelte stores
    const annotationTypeValue = get(selectedAnnotationType);
    const userIdValue = get(userId);
    console.log("IN PROMPTS GOT ANNO TYPE:" + annotationTypeValue);
    console.log("IN PROMPTS also GOT USER ID: " + userIdValue);

    if (!annotationTypeValue || !userIdValue) {
      console.error("Annotation type or user ID is missing.");
      return;
    }

    try {
      // Set waitingForAnnotation to true to start the timer
      waitingForAnnotation = true;

      // Send request to the server
      const response = await fetch("/api/toOpenAI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: adminData,
          question,
          system_prompt,
          prompt_type: annotationTypeValue,
          writer_id: userIdValue,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const newPromptId = responseData.prompt_id;
        console.log(
          "Data sent to OpenAI successfully, new prompt ID:",
          newPromptId
        );

        // Refresh past prompts after a successful request
        fetchPastPrompts();
      } else {
        console.error("Failed to send data to OpenAI");
      }
    } catch (error) {
      console.error("Error sending data to OpenAI:", error);
    } finally {
      waitingForAnnotation = false; // Stop the timer
    }
  }

  function addPromptWindow() {
    const newPrompt = {
      text: ``,
      metrics: {},
      showDetails: true,
      showErrors: false,
      adding: true,
    };
    $prompts = [newPrompt, ...$prompts];
  }

  /**
   * @param {number} index
   */
  function toggleDetails(index) {
    $prompts[index].showDetails = !$prompts[index].showDetails;
  }

  let expInstruction = false;
  function toggleInstructions() {
    expInstruction = !expInstruction;
  }

  let responseText = "";

  function manageTimer() {
    if (waitingForAnnotation) {
      timeElapsed = 0; // Reset timer at the start
      interval = setInterval(() => {
        timeElapsed += 1;
      }, 1000);
    } else {
      clearInterval(interval);
    }
  }

  // Watch waitingForAnnotation to start or stop the timer
  $: if (waitingForAnnotation) {
    manageTimer();
  }

  // Format time as MM:SS
  $: {
    minutes = Math.floor(timeElapsed / 60);
  }
  $: {
    seconds = timeElapsed % 60;
  }
  $: {
    formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  onDestroy(() => {
    clearInterval(interval); // Ensure interval is cleared on component destruction
  });

  function formatTimeSubmitted(time) {
    const date = new Date(time);
    formattedTime = date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
      hour12: false,
    });
    return formattedTime;
  }
</script>

<section>
  <div class="top">
    <h1>
      <Fa icon={faHouse} /> <span style="color:#5facf2">{$userName}</span>'s
      Prompts
    </h1>
    <p>
      Selected Annotation Type: <span style="font-weight:bold"
        >{$selectedAnnotationType}</span
      >
    </p>
    <p>
      You are training an AI to annotate your dataset by creating prompts that
      instruct the AI on how to label your data. Write clear and specific
      prompts, asking the AI to justify its decisions, and refine them based on
      feedback to improve accuracy. Click on View Instructions below for more
      details on how to construct your prompt.
    </p>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="prompt-header" on:click={() => toggleInstructions()}>
      {#if expInstruction}
        <h3 style="margin-top:0; margin-bottom:1%; color: #5facf2">
          <Fa icon={faChevronDown} /> &nbsp; Instructions
        </h3>
      {:else}
        <h3 style="margin-top:0; margin-bottom:1%; color: #5facf2">
          <Fa icon={faChevronRight} /> &nbsp; View Instructions
        </h3>
      {/if}
    </div>

    {#if expInstruction}
      <p>
        You are training an AI to annotate your dataset. To start, you need to
        prompt this AI with a set of instructions. You can also refine your
        prompts based on the AIs performance.
      </p>
      <p>Let's get started!</p>
      <p>
        For example, let's say you are asking the AI to identify whether a
        social media comment is about summer vacations or not. You may write
        something like the prompt below:
      </p>
      <p>
        Please determine whether the following post is about a summer vacation.
        To be about a summer vacation it must both be about a vacation and must
        take place in the summertime. Please first justify your decision and
        then conclude with either: <span style="font-style:italic"
          >“True: This is a post about summer vacation”</span
        >
        or
        <span style="font-style:italic"
          >“False: This is not a post about summer vacation”</span
        >
      </p>
      <p>
        These instructions should be direct and simple. AI models are designed
        to respond in specific ways (e.g., polite and informative), but you can
        tailor their responses by providing clear instructions in your prompts.
        For example, you can ask them to focus on specific aspects of a topic or
        provide evidence for their claims.
      </p>
      <p>
        Here is an extended guide for writing effective prompts:
        <a href="https://midas.umich.edu/a-quick-guide-for-effective-prompting/"
          >https://midas.umich.edu/a-quick-guide-for-effective-prompting/</a
        >.
      </p>
      <p>
        We strongly suggest your prompt includes this instruction somewhere
        within the prompt:
      </p>
      <p style="margin-right: 30%; font-style:italic">
        Please first justify your decision and then conclude with either “True:
        This is X.” or “False: This is not X”.
      </p>
      <p>
        Research has shown that asking the AI to justify its answer improves
        performance. Additionally, the answer will be coded based on whether the
        response includes “True: This is X.” or “False: This is not X”.
      </p>
      <p>
        To get started click the + New Prompt button above. After you have
        entered a prompt you will see how well this prompt was able to instruct
        the AI to label your data. You will also be able to explore examples
        that the AI predicted correctly and incorrectly. Please use this
        feedback to improve your prompt. Click the “+ New Prompt” button above
        again to enter a new prompt. In total we would like you to enter 10
        prompts.
      </p>
    {/if}
    <button on:click={addPromptWindow} style="margin-top: 2%"
      >+ New Prompt</button
    >
  </div>
</section>

<section>
  <!-- <p style="margin-left:5%; margin-right:5%">The response:{responseText}</p> -->
  {#each $prompts as prompt, index}
    {#if prompt.adding}
      <div class="prompt">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="prompt-header" on:click={() => toggleDetails(index)}>
          <h3>New Prompt</h3>
          {#if waitingForAnnotation}
            <p>AI is annotating data. Time elapsed: {formattedTime}</p>
          {/if}
        </div>
        {#if prompt.showDetails}
          <div style="margin: 1% 0% 3% 0%; padding-bottom:2%">
            <textarea
              bind:value={prompt.text}
              placeholder="Please enter your new prompt"
              class="prompt-text"
              style="width:100%; height: 17em;"
            />
            <button on:click={sendPrompt(prompt.text)} style="float: right;"
              >Submit and Test</button
            >
          </div>
        {/if}
      </div>
    {/if}

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    {#if !prompt.adding}
      <div class="prompt">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="prompt-header" on:click={() => toggleDetails(index)}>
          {#if prompt.showDetails}
            <h3>
              <Fa icon={faChevronDown} /> &nbsp; Prompt {prompt.prompt_id}
            </h3>
          {:else}
            <h3>
              <Fa icon={faChevronRight} /> &nbsp; Prompt {prompt.prompt_id}
            </h3>
          {/if}
          <p>{formatTimeSubmitted(prompt.time_submitted)}</p>
        </div>

        {#if prompt.showDetails}
          <div class="prompt-details">
            <div class="prompt-text">{prompt.text}</div>
            <div
              style="width: 25%; display: flex; flex-direction:column; justify-content: space-between;"
            >
              <div class="metrics">
                <!-- Conditionally display metrics if they exist -->
                {#if prompt.metrics}
                  <p><strong>Accuracy:</strong> {prompt.metrics.accuracy}</p>
                  <p><strong>Precision:</strong> {prompt.metrics.precision}</p>
                  <p><strong>Recall:</strong> {prompt.metrics.recall}</p>
                {:else}
                  <p>Loading metrics...</p>
                {/if}
              </div>
              <a
                href={`/examples?title=${encodeURIComponent(prompt.prompt_id)}&id=${prompt.prompt_id}`}
                style="text-align:right;"
                >Error Examples <Fa icon={faChevronRight} /></a
              >
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/each}
</section>

<style>
  .top {
    margin: 0% 5% 3% 5%;
    display: flex-start;
  }

  .prompt {
    margin: 0% 5% 3% 5%;
    padding: 1% 5% 1% 5%;
    border-radius: 10px;
    box-shadow: 0px 0px 2px 2px rgb(0 0 0 / 15%);
  }

  .prompt-header {
    display: flex;
    justify-content: space-between;
    cursor: pointer;
  }

  .prompt-details {
    height: 17em;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 1% 0% 3% 0%;
  }

  .prompt-text {
    border: 1px solid #ccc;
    border-radius: 10px;
    overflow: scroll;
    padding: 3%;
    width: 70%;
  }

  .metrics {
    background-color: #e8f2fe;
    border-radius: 5px;
    padding: 10%;
  }

  .metrics p {
    margin: 0;
  }

  button {
    background-color: #5facf2;
    color: white;
    border: none;
    padding: 8px 15px;
    cursor: pointer;
    border-radius: 5px;
  }

  a:link {
    text-decoration: none;
    color: #188df9;
  }

  a:visited {
    text-decoration: none;
    color: #188df9;
  }

  a:hover {
    text-decoration: solid;
    color: #5facf2;
    font-weight: bold;
  }

  a:active {
    text-decoration: none;
    color: #5facf2;
  }
</style>
