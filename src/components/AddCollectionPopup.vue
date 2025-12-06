<template>
  <div v-if="isOpen" class="popup-overlay" @click.self="handleClose">
    <div class="popup-modal">
      <!-- Header -->
      <div class="popup-header">
        <h2>Add Collection</h2>
        <button class="close-button" @click="handleClose" aria-label="Close">
          ×
        </button>
      </div>

      <!-- Single scrollable form with all steps -->
      <div class="popup-content">
        <div class="all-steps-form">
          <!-- Step 1: Collection Name -->
          <div class="form-section">
            <h3>1. Collection Name *</h3>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Enter collection name..."
              class="form-input"
            />
          </div>

          <!-- Step 2: Add Shared Users -->
          <div class="form-section">
            <h3>2. Add Shared Users</h3>
            <input
              v-model="sharedUserInput"
              type="email"
              placeholder="Enter user email address..."
              class="form-input"
              @keydown.enter="addSharedUser"
            />
            <div class="shared-users-list">
              <div
                v-for="user in formData.sharedUsers"
                :key="user"
                class="user-chip"
              >
                {{ user }}
                <button @click="removeSharedUser(user)" class="chip-remove">
                  ×
                </button>
              </div>
            </div>
            <p class="form-hint">Press Enter to add a user by email</p>
          </div>

          <!-- Step 3: Add Recipes -->
          <div class="form-section">
            <h3>3. Add Recipes</h3>
            <select
              v-model="selectedRecipeId"
              class="form-input"
              @change="addRecipe"
            >
              <option value="">Select a recipe to add...</option>
              <option
                v-for="recipe in availableRecipes"
                :key="recipe._id"
                :value="recipe._id"
              >
                {{ recipe.title }}
              </option>
            </select>
            <div class="recipes-list">
              <div
                v-for="recipeId in formData.recipes"
                :key="recipeId"
                class="recipe-item"
              >
                <span>{{ getRecipeTitle(recipeId) }}</span>
                <button @click="removeRecipe(recipeId)" class="remove-button">
                  ×
                </button>
              </div>
            </div>
            <p class="form-hint">Select recipes from the dropdown</p>
          </div>
        </div>
      </div>

      <!-- Footer with submit button -->
      <div class="popup-footer">
        <button @click="submitCollection" class="nav-button primary">
          Create Collection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import "./AddCollectionPopup.css";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  recipes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "submit"]);

const formData = ref({
  name: "",
  sharedUsers: [],
  recipes: [],
});

const sharedUserInput = ref("");
const selectedRecipeId = ref("");

// Filter out recipes that are already added
const availableRecipes = computed(() => {
  return props.recipes.filter(
    (recipe) => !formData.value.recipes.includes(recipe._id)
  );
});

function getRecipeTitle(recipeId) {
  const recipe = props.recipes.find((r) => r._id === recipeId);
  return recipe ? recipe.title : recipeId;
}

function addSharedUser() {
  const user = sharedUserInput.value.trim();
  if (user && !formData.value.sharedUsers.includes(user)) {
    formData.value.sharedUsers.push(user);
    sharedUserInput.value = "";
  }
}

function removeSharedUser(user) {
  formData.value.sharedUsers = formData.value.sharedUsers.filter(
    (u) => u !== user
  );
}

function addRecipe() {
  if (
    selectedRecipeId.value &&
    !formData.value.recipes.includes(selectedRecipeId.value)
  ) {
    formData.value.recipes.push(selectedRecipeId.value);
    selectedRecipeId.value = "";
  }
}

function removeRecipe(recipeId) {
  formData.value.recipes = formData.value.recipes.filter(
    (id) => id !== recipeId
  );
}

function handleClose() {
  emit("close");
  // Reset form after a delay
  setTimeout(() => {
    formData.value = {
      name: "",
      sharedUsers: [],
      recipes: [],
    };
  }, 300);
}

function submitCollection() {
  emit("submit", formData.value);
  // Don't auto-close - let the parent close it after successful creation
  // This ensures the collections list is refreshed before closing
  // Reset form after a delay
  setTimeout(() => {
    formData.value = {
      name: "",
      sharedUsers: [],
      recipes: [],
    };
  }, 300);
}
</script>
