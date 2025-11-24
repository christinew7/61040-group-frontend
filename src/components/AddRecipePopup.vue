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
            <h3>3. Add Link</h3>
            <input
              v-model="formData.link"
              type="url"
              placeholder="https://example.com/recipe"
              class="form-input"
            />
          </div>

          <!-- Step 4: Add to Collection -->
          <div class="form-section">
            <h3>4. Add to Collection</h3>
            <select v-model="formData.collection" class="form-select">
              <option value="">-- Select a collection --</option>
              <option value="breakfast">Breakfast Favorites</option>
              <option value="dinner">Dinner Ideas</option>
              <option value="desserts">Desserts</option>
            </select>
            <p class="form-hint">Optional: Add this recipe to a collection</p>
          </div>

          <!-- Step 5: Add Ingredients -->
          <div class="form-section">
            <h3>5. Add Ingredients</h3>
            <textarea
              v-model="formData.ingredientsText"
              placeholder="Enter one ingredient per line in format: quantity,unit,name&#10;Example:&#10;1,cup,flour&#10;2,tablespoons,sugar&#10;0.5,teaspoon,salt"
              class="form-textarea"
              rows="8"
            ></textarea>
            <p class="form-hint">
              Format: <code>quantity,unit,name</code> (one per line)<br />
              Example: <code>1,cup,flour</code>
            </p>
          </div>
        </div>
      </div>

      <!-- Footer with submit button -->
      <div class="popup-footer">
        <button @click="submitRecipe" class="nav-button primary">
          Create Recipe
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import "./AddRecipePopup.css";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "submit"]);

const formData = ref({
  name: "",
  description: "",
  link: "",
  collection: "",
  ingredientsText: "",
});

function handleClose() {
  emit("close");
  // Reset form after a delay
  setTimeout(() => {
    formData.value = {
      name: "",
      description: "",
      link: "",
      collection: "",
      ingredientsText: "",
    };
  }, 300);
}

function submitRecipe() {
  emit("submit", formData.value);
  handleClose();
}
</script>
