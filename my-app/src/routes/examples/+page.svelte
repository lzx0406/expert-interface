<!-- <h1>Welcome to examples biach</h1> -->
<script>
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { getContext } from "svelte";
  // @ts-ignore
  import { csvParse } from "d3-dsv";

  const prompts = getContext("prompts");
  let promptList = [];

  // Subscribe to the store
  $: prompts.subscribe((/** @type {any[]} */ value) => {
    console.log("Current prompts:", value);
    promptList = value;
  });

  const query = $page.url.searchParams;
  const title = query.get("title");
  const id = query.get("id");

  // Store for the parsed CSV data
  const csvData = writable([]);
  /**
   * @type {any[]}
   */
  let filteredData = [];
  let columnHeaders = [
    "concern_wildlife",
    "concern_human",
    "appreciation_wildlife",
    "appreciation_human",
    "call_to_action",
    "bert_cw",
    "bert_ch",
    "bert_aw",
    "bert_ah",
    "bert_call",
  ];

  let selectedLabel = columnHeaders[0]; // Default label
  let selectedValue = "";

  let truePositive = false;
  let falsePositive = false;
  let trueNegative = false;
  let falseNegative = false;

  // Load the CSV file on component mount
  onMount(async () => {
    try {
      const response = await fetch("/combined_data.csv");
      const text = await response.text();
      const data = csvParse(text);
      csvData.set(data);

      //No filters initially, show everything
      filteredData = [...data];
    } catch (error) {
      console.error("Error loading CSV file:", error);
    }
  });

  /**
   * @param {number} value
   */
  function isYes(value) {
    return value == 2 || value == 3;
  }

  /**
   * @param {number} value
   */
  function isNo(value) {
    return value == 0 || value == 1;
  }

  function filterData() {
    csvData.subscribe((data) => {
      filteredData = data.filter((row) => {
        let include = true;

        // If TP, FP, TN, FN filters are applied
        if (truePositive || falsePositive || trueNegative || falseNegative) {
          const mappings = {
            concern_wildlife: "bert_cw",
            concern_human: "bert_ch",
            appreciation_wildlife: "bert_aw",
            appreciation_human: "bert_ah",
            call_to_action: "bert_call",
          };

          include = false; // Start with assuming we exclude the row

          for (const [trueLabel, prediction] of Object.entries(mappings)) {
            const trueValue = parseInt(row[trueLabel], 10);
            const predictedValue = parseInt(row[prediction], 10);

            // True Positive: both true value and predicted value are YES
            if (truePositive && isYes(trueValue) && isYes(predictedValue)) {
              include = true;
            }

            // False Positive: true value is NO, predicted value is YES
            if (falsePositive && isNo(trueValue) && isYes(predictedValue)) {
              include = true;
            }

            // True Negative: both true value and predicted value are NO
            if (trueNegative && isNo(trueValue) && isNo(predictedValue)) {
              include = true;
            }

            // False Negative: true value is YES, predicted value is NO
            if (falseNegative && isYes(trueValue) && isNo(predictedValue)) {
              include = true;
            }
          }
        }

        // Ensure that label comparison also happens
        return include && row[selectedLabel] == selectedValue;
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
        {#each columnHeaders as label}
          <option value={label}>{label}</option>
        {/each}
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
    <!-- <ul>
      {#each filteredData as row}
        <li>{row.comment} (value: {row[selectedLabel]})</li>
      {/each}
    </ul> -->
    {#if filteredData.length > 0}
      <table>
        <thead>
          <tr>
            {#each Object.keys($csvData[0]) as key}
              <th>{key}</th> <!-- Render hardcoded column headers -->
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each filteredData as row}
            <tr>
              {#each Object.values(row) as value}
                <td>{value}</td>
                <!-- Render filtered data based on hardcoded column headers -->
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>No data to display. Apply filters to see the results.</p>
    {/if}
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
