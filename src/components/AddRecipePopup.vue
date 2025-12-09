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
              
              <div class="ingredient-input-choice">
                <label class="radio-option">
                  <input
                    type="radio"
                    v-model="ingredientInputMode"
                    value="manual"
                    name="ingredientMode"
                  />
                  <span>Manual Format</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    v-model="ingredientInputMode"
                    value="ai"
                    name="ingredientMode"
                  />
                  <span>Paste & Format with AI</span>
                </label>
              </div>

              <textarea
                v-model="formData.ingredientsText"
                :placeholder="ingredientInputMode === 'manual' 
                  ? 'Enter one ingredient per line:\nquantity, unit, name\nExample: 1, cup, flour' 
                  : 'Paste ingredients from any recipe...'
                "
                class="form-textarea"
                rows="8"
              ></textarea>
              
              <!-- Parse Button (only for AI mode) -->
              <button
                v-if="ingredientInputMode === 'ai'"
                @click="handleParseIngredients"
                :disabled="isParsingIngredients || !formData.ingredientsText.trim()"
                class="nav-button secondary"
                style="margin-top: 10px"
                type="button"
              >
                {{ isParsingIngredients ? "Parsing..." : "Format with AI" }}
              </button>
              
              <p v-if="parseIngredientsError" class="error-hint">
                {{ parseIngredientsError }}
              </p>
              
              <p class="form-hint">
                {{ ingredientInputMode === 'manual' 
                  ? 'Format: quantity, unit, name (one per line)' 
                  : 'One ingredient per line'
                }}
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

                <!-- Visibility -->
                <div class="form-section">
                  <h3>Visibility</h3>
                  <div class="image-input-group">
                    <label class="radio-option">
                      <input
                        type="radio"
                        v-model="formData.isPublic"
                        :value="true"
                        name="visibility"
                      />
                      <span>Public</span>
                    </label>
                    <label class="radio-option">
                      <input
                        type="radio"
                        v-model="formData.isPublic"
                        :value="false"
                        name="visibility"
                      />
                      <span>Private</span>
                    </label>
                  </div>
                  <p class="form-hint">Public recipes are visible to others; private recipes are only visible to you.</p>
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
import { useRouter } from "vue-router";
import { parseFromLink, parseIngredientsFromText } from "../api/Recipe.js";
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
const router = useRouter();

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
  isPublic: false,
  ingredientsText: "",
});

//Ingredient input
const ingredientInputMode = ref("ai"); 
const isParsingIngredients = ref(false);
const parseIngredientsError = ref("");

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
    console.log(
      "Token being sent:",
      token.value ? `${token.value.substring(0, 20)}...` : "NO TOKEN"
    );
    const recipe = await parseFromLink(
      token.value,
      formData.value.link,
    );
    console.log("Parsed recipe response:", recipe);
    console.log("Recipe owner:", recipe.owner);

    if (!recipe || !recipe._id) {
      throw new Error("Invalid recipe response from server");
    }

    // Reset form immediately before navigating
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
      isPublic: false,
      ingredientsText: "",
    };

    // Recipe successfully parsed! Close popup and navigate to edit
    emit("close");

    // Check if we're already on a Recipe page
    const isAlreadyOnRecipePage = router.currentRoute.value.name === "Recipe";
    
    if (isAlreadyOnRecipePage) {
      // Force navigation by going to home first, then to the new recipe
      await router.push("/home");
      // Small delay to ensure route change is processed
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Navigate to Recipe page with edit mode
    router.push({
      name: "Recipe",
      params: { id: recipe._id },
      query: {
        owner: recipe.owner,
        title: recipe.title,
        edit: "true",  // Flag to open edit modal
        recipe: JSON.stringify(recipe)  // Pass full recipe data
      }
    });
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

async function handleParseIngredients() {
  if (!token.value) {
    parseIngredientsError.value = "Please sign in to use AI formatting";
    return;
  }

  if (!formData.value.ingredientsText.trim()) {
    parseIngredientsError.value = "Please enter some ingredients first";
    return;
  }

  isParsingIngredients.value = true;  
  parseIngredientsError.value = "";

  try {
    const formatted = await parseIngredientsFromText(token.value, formData.value.ingredientsText);
    formData.value.ingredientsText = formatted;
  } catch (error) {
    console.error("Failed to parse ingredients:", error);
    parseIngredientsError.value = error.message || "Failed to parse ingredients";
  } finally {
    isParsingIngredients.value = false;  
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
      isPublic: false,
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
      isPublic: Boolean(formData.value.isPublic),
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
