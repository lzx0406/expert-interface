<!-- <h1>Welcome to examples biach</h1> -->
<script>
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { getContext } from "svelte";
  // @ts-ignore
  import { csvParse } from "d3-dsv";
  import Fa from "svelte-fa";
  import {
    faBookBookmark,
    faChevronLeft,
    faChevronRight,
    faHouse,
  } from "@fortawesome/free-solid-svg-icons";

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
  let predValue = "";
  let trueValue = "";
  let showWrongPredictions = false;

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
    if (value == 2 || value == 3) {
      console.log("Is YES");
      return true;
    }
    return false;
  }

  /**
   * @param {number} value
   */
  function isNo(value) {
    if (value == 0 || value == 1) {
      console.log("Is NOO");
      return true;
    }
    return false;
  }

  /**
   * @param {number} value
   */
  function isYesPred(value) {
    return value == 1;
  }

  /**
   * @param {number} value
   */
  function isNoPred(value) {
    return value == 0;
  }

  function filterData() {
    csvData.subscribe((data) => {
      filteredData = data.filter((row) => {
        let include = true;
        const mappings = {
          concern_wildlife: "bert_cw",
          concern_human: "bert_ch",
          appreciation_wildlife: "bert_aw",
          appreciation_human: "bert_ah",
          call_to_action: "bert_call",
        };

        /**
         * @type {number}
         */
        const truth = row[selectedLabel];
        // @ts-ignore
        const prediction = row[mappings[selectedLabel]];

        // Filter based on prediction value (Yes/No) - only 0/1?
        if (predValue) {
          if (predValue === "Yes") {
            include = include && isYesPred(prediction);
          } else if (predValue === "No") {
            include = include && isNoPred(prediction);
          }
        }

        if (trueValue) {
          if (trueValue === "Yes") {
            include = include && isYes(truth);
          } else if (trueValue === "No") {
            include = include && isNo(truth);
          }
        }

        if (showWrongPredictions) {
          include = include && truth != prediction;
        }

        return include;
      });
    });
  }
</script>

<section>
  <div class="top">
    <a href={`../`}><Fa icon={faHouse} /> Back to My Prompts </a>
    <h1>Annotation Examples</h1>
    <p>Prompt {id}</p>
    <p>{$prompts[id - 1].text}</p>
  </div>
</section>

<section class="filters-and-metrics">
  <div class="filter">
    <h3 style="margin-bottom: 0px; margin-top:0px;">Filter Examples</h3>
    <p style="margin-top:0px; color:#666666; font-size:small;">
      Define filters to view a subset of the examples based on selected criteria
    </p>

    <div style="display: flex; justify-content: space-between;">
      <div class="adjust-filters">
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
          <select bind:value={predValue}>
            <option value="">Any</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div style="margin-bottom: 1%">
          <label>True value</label>
          <select bind:value={trueValue}>
            <option value="">Any</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div style="margin-bottom: 1%">
          <label>
            <input type="checkbox" bind:checked={showWrongPredictions} />
            Show only incorrect predictions
          </label>
        </div>

        <button on:click={filterData} style="margin-top: 2%"
          >Apply Filters</button
        >
      </div>
    </div>
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

  .adjust-filters {
    width: 50%;
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
