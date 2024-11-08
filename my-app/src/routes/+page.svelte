<script>
  import { goto } from "$app/navigation";
  import { selectedAnnotationType } from "$lib/stores";

  /**
   * @param {string} type
   */
  function setAnnotation(type) {
    selectedAnnotationType.set(type);
  }

  function navigateToLogin() {
    goto("/login");
  }

  function navigateToSignup() {
    goto("/signup");
  }
</script>

<main>
  <h1>Welcome to the AI Data Annotation Application</h1>

  <div class="annotation-type">
    <label>
      <input
        type="radio"
        name="annotationType"
        value="concern wildlife"
        on:change={() => setAnnotation("concern wildlife")}
      />
      Annotate for Concern for Wildlife
    </label>
    <label>
      <input
        type="radio"
        name="annotationType"
        value="call to action"
        on:change={() => setAnnotation("call to action")}
      />
      Annotate for Call to Action
    </label>
  </div>

  <div class="actions">
    <button on:click={navigateToLogin}>Log In</button>
    <button on:click={navigateToSignup}>Sign Up</button>
  </div>

  <p style="margin:10% 20% 0% 20%">
    This application helps you train an AI to annotate your dataset by creating
    prompts that instruct the AI on how to label your data analyze video
    comments. <br />
    With the initial iteration of the application, you can explore how to improve
    AI annotation quality in understanding wildlife conservation efforts in the context
    of YouTube video and comments.
  </p>
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
    margin-top: 40px;
  }

  .annotation-type label {
    margin-right: 15px;
    cursor: pointer;
  }

  .actions {
    margin-top: 40px;
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
