<script>
  import { goto } from "$app/navigation";

  let selectedAnnotationType = "";

  function navigateToLogin() {
    goto("/login");
  }

  function navigateToSignup() {
    goto("/signup");
  }
</script>

<main>
  <h1>Welcome to the AI Data Annotation Application</h1>
  <p style="margin:20%">
    This application helps you train an AI to annotate your dataset by creating
    prompts that instruct the AI on how to label your data analyze video
    comments. <br />
    With the initial iteration of the application, you can explore how to improve
    AI annotation quality in understanding wildlife conservation efforts in the context
    of YouTube video and comments.
  </p>

  <!-- Radio button selection for annotation type -->
  <div class="annotation-type">
    <label>
      <input
        type="radio"
        name="annotationType"
        value="conservation"
        bind:group={selectedAnnotationType}
      />
      Annotate for Conservation
    </label>
    <label>
      <input
        type="radio"
        name="annotationType"
        value="call-to-action"
        bind:group={selectedAnnotationType}
      />
      Annotate for Call to Action
    </label>
  </div>

  <div class="actions">
    <button on:click={navigateToLogin}>Log In</button>
    <button on:click={navigateToSignup}>Sign Up</button>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }

  .annotation-type {
    margin-top: 20px;
  }

  .annotation-type label {
    margin-right: 15px;
    cursor: pointer;
  }

  .actions {
    margin-top: 20px;
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
