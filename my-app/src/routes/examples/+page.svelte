<!-- <h1>Welcome to examples biach</h1> -->
<script>
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  // import { prompts } from "$lib/stores";
  import { page } from "$app/stores";
  import { getContext } from "svelte";

  // Retrieve the prompts store from context
  const prompts = getContext("prompts");

  let promptList = [];

  // Subscribe to the store
  $: prompts.subscribe((value) => {
    console.log("Current prompts:", value);
    promptList = value;
  });

  const query = $page.url.searchParams;
  const title = query.get("title");
  const id = query.get("id");

  import { csvParse } from "d3-dsv";

  // Store for the parsed CSV data
  const csvData = writable([]);

  // Load the CSV file on component mount
  onMount(async () => {
    try {
      const response = await fetch("/combined_data.csv");
      const text = await response.text();
      const data = csvParse(text);
      csvData.set(data);
    } catch (error) {
      console.error("Error loading CSV file:", error);
    }
  });

  let filteredData = [];

  let selectedLabel = "concern_wildlife"; // Default label
  let selectedValue = "";

  let truePositive = false;
  let falsePositive = false;
  let trueNegative = false;
  let falseNegative = false;

  function filterData() {
    csvData.subscribe((data) => {
      filteredData = data.filter((row) => {
        const value = parseInt(row[selectedLabel], 10);

        // Filter based on true/false positive/negative criteria
        let include = true;

        if (truePositive && !(value === 2 || value === 3)) include = false;
        if (falsePositive && !(value === 0 || value === 1)) include = false;
        if (trueNegative && !(value === 2 || value === 3)) include = false;
        if (falseNegative && !(value === 0 || value === 1)) include = false;

        return include && value == selectedValue;
      });
    });
  }
</script>

<section>
  <div class="top">
    <!-- <h1>Annotation Examples for {title}</h1> -->
    <h1>Annotation Examples</h1>
    <p>Prompt {id}</p>
    <p>Welcome {$prompts[id - 1].text}</p>
  </div>
</section>

<section>
  <div class="filter">
    <h3 style="margin-bottom: 0px; margin-top:0px;">Filter Examples</h3>
    <p style="margin-top:0px; color:#666666; font-size:small;">
      Define filters to view a subset of the examples based on selected criteria
    </p>

    <div style="margin-bottom: 1%">
      <label>Label</label>
      <select bind:value={selectedLabel}>
        <option value="concern_wildlife">Concern Wildlife</option>
        <option value="appreciation_wildlife">Appreciation Wildlife</option>
        <!-- Add more options for other labels -->
      </select>
    </div>

    <div style="margin-bottom: 1%">
      <label>Predicted value</label>
      <input type="number" bind:value={selectedValue} min="0" max="3" />
    </div>

    <div style="margin-bottom: 1%">
      <label>
        <input type="checkbox" bind:checked={falsePositive} /> False Positive
      </label>
      <label>
        <input type="checkbox" bind:checked={falseNegative} /> False Negative
      </label>
      <label>
        <input type="checkbox" bind:checked={truePositive} /> True Positive
      </label>
      <label>
        <input type="checkbox" bind:checked={trueNegative} /> True Negative
      </label>
    </div>

    <button on:click={filterData}>Apply Filters</button>
  </div>

  <div class="all-data">
    <h2>Filtered Examples</h2>
    <ul>
      {#each filteredData as row}
        <li>{row.comment} (value: {row[selectedLabel]})</li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .top {
    margin: 0% 5% 3% 5%;
    display: flex-start;
  }

  .filter {
    margin: 0% 5% 3% 5%;
    background-color: #fafafa;
    padding: 2%;
    border-radius: 10px;
  }

  .all-data {
    margin: 0% 5% 3% 5%;
    overflow: scroll;
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
