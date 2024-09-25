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
</script>

<section>
  <div class="top">
    <!-- <h1>Annotation Examples for {title}</h1> -->
    <h1>Annotation Examples</h1>
    <p>Welcome {$prompts[0].text}</p>
    <p>Prompt {id}</p>
  </div>
</section>

<style>
  .top {
    margin: 0% 0% 3% 5%;
    display: flex-start;
  }
</style>
