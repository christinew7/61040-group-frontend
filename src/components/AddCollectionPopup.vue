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
            <input
              v-model="recipeInput"
              type="text"
              placeholder="Enter recipe name or ID..."
              class="form-input"
              @keydown.enter="addRecipe"
            />
            <div class="recipes-list">
              <div
                v-for="(recipe, index) in formData.recipes"
                :key="index"
                class="recipe-item"
              >
                <span>{{ recipe }}</span>
                <button @click="removeRecipe(index)" class="remove-button">
                  ×
                </button>
              </div>
            </div>
            <p class="form-hint">Press Enter to add a recipe</p>
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
import { ref } from "vue";
import "./AddCollectionPopup.css";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "submit"]);

const formData = ref({
  name: "",
  sharedUsers: [],
  recipes: [],
});

const sharedUserInput = ref("");
const recipeInput = ref("");

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
  const recipe = recipeInput.value.trim();
  if (recipe) {
    formData.value.recipes.push(recipe);
    recipeInput.value = "";
  }
}

function removeRecipe(index) {
  formData.value.recipes.splice(index, 1);
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
  handleClose();
}
</script>
