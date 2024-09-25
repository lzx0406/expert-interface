<script>
  import { writable } from "svelte/store";
  import { setContext } from "svelte";

  // Create a writable store for prompts
  const prompts = writable([]);

  // Set some initial values for testing
  const initialPrompts = [
    {
      id: 1,
      title: "Prompt 1",
      text: `Given the following text, determine if it exhibits an intent towards promoting wildlife preservation. Consider if the text includes actions, advocacy, suggestions, or support for activities such as protecting endangered species, conserving habitats, reducing human impact on ecosystems, or advocating for conservation policies. Respond with 'Yes' if the text promotes wildlife preservation and 'No' if it does not. Additionally, provide a brief explanation for your decision.
Text: "This bear looks cute, but it shouldn't be so close to camp." Given the following text, determine if it exhibits an intent towards promoting wildlife preservation. Consider if the text includes actions, advocacy, suggestions, or support for activities such as protecting endangered species, conserving habitats, reducing human impact on ecosystems, or advocating for conservation policies. Respond with 'Yes' if the text promotes wildlife preservation and 'No' if it does not. Additionally, provide a brief explanation for your decision.
Text: "This bear looks cute, but it shouldn't be so close to camp." Given the following text, determine if it exhibits an intent towards promoting wildlife preservation. Consider if the text includes actions, advocacy, suggestions, or support for activities such as protecting endangered species, conserving habitats, reducing human impact on ecosystems, or advocating for conservation policies. Respond with 'Yes' if the text promotes wildlife preservation and 'No' if it does not. Additionally, provide a brief explanation for your decision.
Text: "This bear looks cute, but it shouldn't be so close to camp."`,
      date: "09/17/2024",
      accuracy: "85%",
      f1Score: "0.78",
      precision: "0.80",
      recall: "0.76",
      showDetails: false,
      showErrors: false,
      adding: false,
    },
    {
      id: 2,
      title: "Prompt 2",
      text: `Given the following text, determine if it exhibits an intent towards promoting wildlife preservation...`,
      date: "09/18/2024",
      accuracy: "90%",
      f1Score: "0.85",
      precision: "0.87",
      recall: "0.83",
      showDetails: false,
      showErrors: false,
      adding: false,
    },
    {
      id: 3,
      title: "Prompt 3",
      text: "Example prompt",
      date: "09/19/2024",
      accuracy: "88%",
      f1Score: "0.82",
      precision: "0.84",
      recall: "0.80",
      showDetails: false,
      showErrors: false,
      adding: false,
    },
  ];

  // Set the initial prompts in the store
  // @ts-ignore
  prompts.set(initialPrompts);

  // Use setContext to make the store available to child components
  setContext("prompts", prompts);
</script>

<slot />
