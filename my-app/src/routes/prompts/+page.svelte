<!-- <h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p> -->
<!-- <script lang="ts"> -->
<script>
  import { writable } from "svelte/store";
  import { setContext } from "svelte";

  import { getContext } from "svelte";
  import Fa from "svelte-fa";
  import {
    faChevronLeft,
    faChevronRight,
    faChevronDown,
    faHouse,
  } from "@fortawesome/free-solid-svg-icons";

  // Retrieve the prompts store from context
  const prompts = getContext("prompts");

  let promptList = [];

  // Subscribe to the store
  $: prompts.subscribe((/** @type {any[]} */ value) => {
    console.log("Current prompts:", value);
    promptList = value;
  });

  function addPromptWindow() {
    const newPrompt = {
      id: $prompts.length + 1,
      title: `Prompt ${$prompts.length + 1}`,
      text: ``,
      date: new Date().toLocaleDateString(),
      accuracy: "",
      f1Score: "",
      precision: "",
      recall: "",
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

  /**
   * @param {any} promptText
   * @param {string | number} index
   */
  async function sendPrompt(promptText, index) {
    const apiKey = "";
    const endpoint = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or another model?
        messages: [{ role: "user", content: promptText }],
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    responseText = data.choices[0].message.content;

    $prompts[0].adding = false;
    $prompts = [...$prompts];
  }
</script>

<section>
  <div class="top">
    <h1><Fa icon={faHouse} /> My Prompts</h1>
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
          <h3>{prompt.title}</h3>
          <p>{prompt.date}</p>
        </div>
        {#if prompt.showDetails}
          <div style="margin: 1% 0% 3% 0%; padding-bottom:2%">
            <textarea
              bind:value={prompt.text}
              placeholder="Please enter your new prompt"
              class="prompt-text"
              style="width:100%; height: 17em;"
            />
            <button
              on:click={sendPrompt(prompt.text, prompt.id)}
              style="float: right;">Submit and Test</button
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
            <h3><Fa icon={faChevronDown} /> &nbsp; {prompt.title}</h3>
          {:else}
            <h3><Fa icon={faChevronRight} /> &nbsp; {prompt.title}</h3>
          {/if}
          <p>{prompt.date}</p>
        </div>

        {#if prompt.showDetails}
          <div class="prompt-details">
            <div class="prompt-text">{prompt.text}</div>
            <div
              style="width: 25%; display: flex; flex-direction:column; justify-content: space-between;"
            >
              <div class="metrics">
                <p><strong>Accuracy:</strong> {prompt.accuracy}</p>
                <p><strong>F1 Score:</strong> {prompt.f1Score}</p>
                <p><strong>Precision:</strong> {prompt.precision}</p>
                <p><strong>Recall:</strong> {prompt.recall}</p>
              </div>
              <a
                href={`/examples?title=${encodeURIComponent(prompt.title)}&id=${prompt.id}`}
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
