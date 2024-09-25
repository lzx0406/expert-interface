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

  let metrics = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  };

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
      console.log("TRUEEEeeeee");
      return true;
    }
    return false;
  }

  /**
   * @param {number} value
   */
  function isNo(value) {
    if (value == 0 || value == 1) {
      console.log("Falseeeeeee");
      return true;
    }
    return false;
  }

  function filterData() {
    csvData.subscribe((data) => {
      filteredData = data.filter((row) => {
        let include = true;
        let tp = 0,
          fp = 0,
          tn = 0,
          fn = 0;

        // If TP, FP, TN, FN filters are applied
        if (truePositive || falsePositive || trueNegative || falseNegative) {
          const mappings = {
            concern_wildlife: "bert_cw",
            concern_human: "bert_ch",
            appreciation_wildlife: "bert_aw",
            appreciation_human: "bert_ah",
            call_to_action: "bert_call",
          };
          const trueLabel = selectedLabel;
          const prediction = mappings[selectedLabel];

          include = false; // Start with assuming we exclude the row

          // console.log("TRUEEEE label:" + trueLabel);
          const trueValue = parseInt(row[trueLabel], 10);
          console.log("TRUE val" + trueValue);
          const predictedValue = parseInt(row[prediction], 10);
          // console.log("Pred label:" + prediction);
          console.log("pred val" + predictedValue);

          if (isNaN(trueValue) || isNaN(predictedValue)) {
            return false;
          }

          // True Positive: both true value and predicted value are YES
          if (truePositive && isYes(trueValue) && isYes(predictedValue)) {
            console.log("TPPPPPPPPP");
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
            console.log("FFFNNNNN");
            include = true;
          }
        }

        // Calculate metrics for the filtered data
        const accuracy = (tp + tn) / (tp + tn + fp + fn);
        const precision = tp / (tp + fp || 1); // Prevent division by zero
        const recall = tp / (tp + fn || 1);
        const f1Score = 2 * ((precision * recall) / (precision + recall || 1));

        // Update the UI with the calculated metrics
        console.log("Accuracy:", accuracy);
        console.log("Precision:", precision);
        console.log("Recall:", recall);
        console.log("F1 Score:", f1Score);

        // Set the metrics to be displayed in the UI
        metrics = {
          accuracy: accuracy.toFixed(2),
          precision: precision.toFixed(2),
          recall: recall.toFixed(2),
          f1Score: f1Score.toFixed(2),
        };

        // Ensure that label comparison also happens
        if (
          selectedValue == "0" ||
          selectedValue == "1" ||
          selectedValue == "2" ||
          selectedValue == "3"
        ) {
          return include && row[selectedLabel] == selectedValue;
        }
        return include;
        // return include;
      });
    });
  }
</script>

<section>
  <div class="top">
    <!-- <h1>Annotation Examples for {title}</h1> -->
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
          <input type="number" bind:value={selectedValue} min="0" max="3" />
        </div>

        <div style="margin-bottom: 1%">
          <p style="margin-bottom:0px; color:#666666; font-size:small;">
            Confusion Matrix defined with 0 to 1=False, 2 to 3 True
          </p>
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

        <button on:click={filterData} style="margin-top: 2%"
          >Apply Filters</button
        >
      </div>

      <div class="metrics">
        <p><strong>Accuracy:</strong> {metrics.accuracy}</p>
        <p><strong>F1 Score:</strong> {metrics.f1Score}</p>
        <p><strong>Precision:</strong> {metrics.precision}</p>
        <p><strong>Recall:</strong> {metrics.recall}</p>
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

  .metrics {
    background-color: #e8f2fe;
    border-radius: 5px;
    padding: 2%;
    width: 30%;
  }
  .metrics p {
    margin: 0;
  }
</style>
