// src/lib/stores.js
import { writable } from "svelte/store";
export const selectedAnnotationType = writable("");

export const userId = writable(null);
export const userName = writable(null);
export const prompts = writable([]);
