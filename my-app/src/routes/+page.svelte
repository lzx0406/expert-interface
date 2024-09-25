<!-- <h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p> -->
<!-- <script lang="ts"> -->
<script>
  import { writable } from "svelte/store";
  import { setContext } from "svelte";

  import { getContext } from "svelte";

  // Retrieve the prompts store from context
  const prompts = getContext("prompts");

  let promptList = [];

  // Subscribe to the store
  $: prompts.subscribe((value) => {
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
    // addPrompt(newPrompt);
    $prompts = [newPrompt, ...$prompts];
  }

  function addPrompt(newPrompt) {
    $prompts = [...$prompts, newPrompt];
  }

  function toggleDetails(index) {
    $prompts[index].showDetails = !$prompts[index].showDetails;
  }

  // function toggleErrors(index) {
  //   prompts[index].showErrors = !prompts[index].showErrors;
  // }
</script>

<section>
  <div class="top">
    <h1>My Prompts</h1>
    <button on:click={addPromptWindow}>+ New Prompt</button>
  </div>
</section>

<section>
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
            <button style="float: right;">Submit and Test</button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    {#if !prompt.adding}
      <div class="prompt">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="prompt-header" on:click={() => toggleDetails(index)}>
          <h3>{prompt.title}</h3>
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
              <!-- <button on:click={() => toggleErrors(index)}>Error examples</button> -->
              <!-- <a href="/examples/${prompt.id}" style="text-align:right;"
                >View Examples</a
              > -->
              <a
                href={`/examples?title=${encodeURIComponent(prompt.title)}&id=${prompt.id}`}
                style="text-align:right;">Error Examples</a
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
    margin: 0% 0% 3% 5%;
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
</style>
