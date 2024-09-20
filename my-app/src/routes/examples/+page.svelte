<!-- <h1>Welcome to examples biach</h1> -->
<script>
  import { writable } from "svelte/store";
  // import { prompts } from "$lib/stores";
  import { page } from "$app/stores";

  const query = $page.url.searchParams;
  const title = query.get("title");
  const id = query.get("id");
</script>

<section>
  <div class="top">
    <!-- <h1>Annotation Examples for {title}</h1> -->
    <h1>Annotation Examples</h1>
    <p>Prompt {id}</p>
  </div>
</section>

<style>
  .top {
    margin: 0% 0% 3% 5%;
    display: flex-start;
  }
</style>
