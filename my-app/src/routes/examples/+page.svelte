<!-- <h1>Welcome to examples biach</h1> -->
<script>
  // @ts-nocheck

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
    faToggleOn,
    faToggleOff,
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

  const mappings = {
    concern_wildlife: "bert_cw",
    concern_human: "bert_ch",
    appreciation_wildlife: "bert_aw",
    appreciation_human: "bert_ah",
    call_to_action: "bert_call",
  };

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
          include = include && isYes(truth) != isYesPred(prediction);
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
    <p>{$prompts[$prompts.length - id].text}</p>
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
        <div style="margin-bottom: 1.5%">
          <label>Label</label>
          <select bind:value={selectedLabel}>
            {#each columnHeaders as label}
              <option value={label}>{label}</option>
            {/each}
          </select>
        </div>

        <div style="margin-bottom: 1.5%">
          <label>Predicted value according to AI</label>
          <select bind:value={predValue}>
            <option value="">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div style="margin-bottom: 1.5%">
          <label>True value according to researcher</label>
          <select bind:value={trueValue}>
            <option value="">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div style="margin-bottom: 1.5%">
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              style="cursor: pointer; display: flex; align-items: center;"
              on:click={() => (showWrongPredictions = !showWrongPredictions)}
            >
              <Fa
                icon={showWrongPredictions ? faToggleOn : faToggleOff}
                style="color:#5facf2; font-size: 1.5rem;"
              />
              <span style="margin-left: 10px;">
                Show only incorrect predictions
              </span>
            </div>
          </label>
        </div>

        <button on:click={filterData} style="margin-top: 2%"
          >Apply Filters</button
        >
      </div>
    </div>
  </div>

  <div class="all-data">
    <h2>
      Filtered Examples for <span style="color:#188df9">{selectedLabel} </span>
    </h2>
    <!-- <ul>
      {#each filteredData as row}
        <li>{row.comment} (value: {row[selectedLabel]})</li>
      {/each}
    </ul> -->
    {#if filteredData.length > 0}
      <table class="styled-table">
        <thead>
          <tr>
            <th></th>
            <th>Video URL</th>
            <th>Comment</th>
            <th>Predicted Value</th>
            <th>True Value</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredData as row, i}
            <tr>
              <td>{row.index}</td>
              <td
                ><a href="https://www.youtube.com/watch?v={row.video_url}"
                  >{row.video_url}</a
                ></td
              >
              <td>{row.comment}</td>
              <td>{isYesPred(row[mappings[selectedLabel]]) ? "Yes" : "No"}</td>
              <td>{isYes(row[selectedLabel]) ? "Yes" : "No"}</td>
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

  .styled-table {
    width: 100%;
    border-collapse: collapse;
    margin: 25px 0;
    font-size: 0.9em;
    /* font-family: "Arial", sans-serif; */
    border-radius: 5px 5px 0 0;
    overflow: hidden;
    border-radius: 1em;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .styled-table thead tr {
    background-color: #5fabf232;
    /* color: #ffffff; */
    text-align: left;
    font-weight: bold;
  }

  .styled-table th,
  .styled-table td {
    padding: 12px 15px;
    border: 1px solid #dddddd;
    text-align: left;
  }

  .styled-table tbody tr {
    border-bottom: 1px solid #dddddd;
  }

  .styled-table tbody tr:nth-of-type(even) {
    background-color: #f3f3f3;
  }

  .styled-table tbody tr:last-of-type {
    border-bottom: 2px solid #5facf2;
  }

  .styled-table tbody tr:hover {
    background-color: #f1f1f1;
  }

  .styled-table tbody tr td a {
    color: #5facf2;
    text-decoration: none;
  }

  .styled-table tbody tr td a:hover {
    text-decoration: underline;
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
