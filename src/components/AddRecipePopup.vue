<template>
  <div v-if="isOpen" class="popup-overlay" @click.self="handleClose">
    <div class="popup-modal">
      <!-- Header -->
      <div class="popup-header">
        <h2>Add Recipe</h2>
        <button class="close-button" @click="handleClose" aria-label="Close">
          ×
        </button>
      </div>

      <!-- Single scrollable form with all steps -->
      <div class="popup-content">
        <div class="all-steps-form">
          <!-- Input Mode Selection -->
          <div class="form-section">
            <h3>Input Method</h3>
            <div class="image-input-group">
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="inputMode"
                  value="manual"
                  name="inputMode"
                />
                <span>Manual Entry</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="inputMode"
                  value="link"
                  name="inputMode"
                />
                <span>Parse from Link</span>
              </label>
            </div>
          </div>

          <!-- Parse from Link Section -->
          <div v-if="inputMode === 'link'" class="form-section">
            <h3>Recipe Link *</h3>
            <input
              v-model="formData.link"
              type="url"
              placeholder="https://example.com/recipe"
              class="form-input"
              :disabled="isParsing || isParsed"
            />
            <button
              v-if="!isParsed"
              @click="parseRecipeFromLink"
              :disabled="!formData.link || isParsing"
              class="nav-button secondary"
              style="margin-top: 10px"
            >
              {{ isParsing ? "Parsing..." : "Parse Recipe" }}
            </button>
            <p v-if="isParsed" class="success-hint" style="margin-top: 10px">
              ✓ Recipe parsed successfully! You can now add an image and submit.
            </p>
            <p v-if="parseError" class="error-hint" style="margin-top: 10px">
              {{ parseError }}
            </p>
          </div>

          <!-- Manual Entry Fields -->
          <template v-if="inputMode === 'manual'">
            <!-- Step 1: Recipe Name -->
            <div class="form-section">
              <h3>1. Recipe Name *</h3>
              <input
                v-model="formData.name"
                type="text"
                placeholder="Enter recipe name..."
                class="form-input"
              />
            </div>

            <!-- Step 2: Description -->
            <div class="form-section">
              <h3>2. Description</h3>
              <textarea
                v-model="formData.description"
                placeholder="Describe your recipe..."
                class="form-textarea"
                rows="4"
              ></textarea>
            </div>

            <!-- Step 3: Add Link -->
            <div class="form-section">
              <h3>3. Add Link (Optional)</h3>
              <input
                v-model="formData.link"
                type="url"
                placeholder="https://example.com/recipe"
                class="form-input"
              />
            </div>

            <!-- Step 6: Add Ingredients -->
            <div class="form-section">
              <h3>4. Add Ingredients</h3>
              <textarea
                v-model="formData.ingredientsText"
                placeholder="Enter one ingredient per line in format: quantity, unit, name&#10;Example:&#10;1, cup, flour&#10;2, tablespoons, sugar&#10;0.5, teaspoon, salt"
                class="form-textarea"
                rows="8"
              ></textarea>
              <p class="form-hint">
                Format: <code>quantity, unit, name</code> (one per line)<br />
                Example: <code>1, cup, flour</code>
              </p>
            </div>
          </template>

          <!-- Parsed Recipe Display (read-only) -->
          <template v-if="inputMode === 'link' && isParsed">
            <div class="form-section">
              <h3>Parsed Recipe Details</h3>
              <div class="parsed-info">
                <p><strong>Name:</strong> {{ parsedRecipe.title }}</p>
                <p v-if="parsedRecipe.description">
                  <strong>Description:</strong> {{ parsedRecipe.description }}
                </p>
                <p v-if="parsedRecipe.link">
                  <strong>Link:</strong> {{ parsedRecipe.link }}
                </p>
              </div>
            </div>
          </template>

          <!-- Step 4: Add Image (Available in both modes) -->
          <div class="form-section">
            <h3>{{ inputMode === "manual" ? "5." : "" }} Add Image</h3>
            <div class="image-input-group">
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="imageInputType"
                  value="url"
                  name="imageType"
                />
                <span>Image URL</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="imageInputType"
                  value="upload"
                  name="imageType"
                />
                <span>Upload Image</span>
              </label>
            </div>

            <!-- Image URL Input -->
            <div v-if="imageInputType === 'url'" class="input-container">
              <input
                v-model="formData.image"
                type="url"
                placeholder="https://example.com/image.jpg"
                class="form-input"
              />
            </div>

            <!-- Image Upload Input -->
            <div v-else class="input-container">
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="form-input file-input"
              />
              <p v-if="uploadedFileName" class="file-name">
                Selected: {{ uploadedFileName }}
              </p>
            </div>

            <p class="form-hint">Optional: Add an image for your recipe</p>
          </div>

          <!-- Step 5: Add to Collection -->
          <div class="form-section">
            <h3>{{ inputMode === "manual" ? "6." : "" }} Add to Collection</h3>
            <select v-model="formData.collection" class="form-select">
              <option value="">-- Select a collection --</option>
              <option
                v-for="collection in collections"
                :key="collection._id"
                :value="collection._id"
              >
                {{ collection.name }}
              </option>
            </select>
            <p class="form-hint">Optional: Add this recipe to a collection</p>
          </div>
        </div>
      </div>

      <!-- Footer with submit button -->
      <div class="popup-footer">
        <button
          @click="submitRecipe"
          :disabled="!canSubmit"
          class="nav-button primary"
        >
          {{
            inputMode === "link" && !isParsed
              ? "Parse Recipe First"
              : "Create Recipe"
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { parseFromLink } from "../api/Recipe.js";
import { useAuth } from "../composables/useAuth.js";
import "./AddRecipePopup.css";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  collections: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "submit", "submitParsed"]);

const { token } = useAuth();

const inputMode = ref("manual"); // 'manual' or 'link'
const imageInputType = ref("url");
const uploadedFileName = ref("");
const isParsing = ref(false);
const isParsed = ref(false);
const parseError = ref("");
const parsedRecipe = ref(null);

const formData = ref({
  name: "",
  description: "",
  link: "",
  image: "",
  collection: "",
  ingredientsText: "",
});

const canSubmit = computed(() => {
  if (inputMode.value === "manual") {
    return formData.value.name.trim() !== "";
  } else {
    // Link mode requires parsing first
    return isParsed.value;
  }
});

async function parseRecipeFromLink() {
  if (!formData.value.link) {
    parseError.value = "Please enter a recipe link";
    return;
  }

  if (!token.value) {
    parseError.value = "Please sign in to parse recipes";
    return;
  }

  isParsing.value = true;
  parseError.value = "";

  try {
    console.log("Parsing recipe from link:", formData.value.link);
    const recipe = await parseFromLink(token.value, formData.value.link);
    console.log("Parsed recipe response:", recipe);

    if (!recipe || !recipe._id) {
      throw new Error("Invalid recipe response from server");
    }

    parsedRecipe.value = recipe;
    isParsed.value = true;
    parseError.value = "";
    console.log("Recipe parsed successfully, ID:", recipe._id);
  } catch (error) {
    console.error("Error parsing recipe from link:", error);
    parseError.value = error.message || "Failed to parse recipe from link";
    isParsed.value = false;
    parsedRecipe.value = null;
  } finally {
    isParsing.value = false;
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadedFileName.value = file.name;

    // Convert image to base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.image = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function handleClose() {
  emit("close");
  // Reset form after a delay
  setTimeout(() => {
    inputMode.value = "manual";
    imageInputType.value = "url";
    uploadedFileName.value = "";
    isParsing.value = false;
    isParsed.value = false;
    parseError.value = "";
    parsedRecipe.value = null;
    formData.value = {
      name: "",
      description: "",
      link: "",
      image: "",
      collection: "",
      ingredientsText: "",
    };
  }, 300);
}

function submitRecipe() {
  console.log("submitRecipe called, canSubmit:", canSubmit.value);
  console.log("inputMode:", inputMode.value);
  console.log("isParsed:", isParsed.value);
  console.log("formData:", formData.value);
  console.log("parsedRecipe:", parsedRecipe.value);

  if (!canSubmit.value) {
    console.warn("Submit blocked: canSubmit is false");
    return;
  }

  if (inputMode.value === "link" && isParsed.value) {
    // Submit parsed recipe with optional image and collection
    const submissionData = {
      parsedRecipeId: parsedRecipe.value._id,
      image: formData.value.image,
      collection: formData.value.collection,
    };
    console.log("Submitting parsed recipe data:", submissionData);
    emit("submitParsed", submissionData);
  } else {
    // Submit manual recipe
    console.log("Submitting manual recipe data:", formData.value);
    emit("submit", formData.value);
  }

  handleClose();
}
</script>
