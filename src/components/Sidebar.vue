<template>
  <aside class="sidebar">
    <!-- Title -->
    <div class="sidebar-title" @click="handleHomeClick">
      <h1>cooked!</h1>
    </div>

    <!-- Auth Section -->
    <div v-if="!isLoggedIn" class="auth-section">
      <button @click="handleSignIn" class="signin-button">Sign In</button>
    </div>

    <!-- My Profile Section (logged in only) -->
    <div v-else class="profile-section">
      <div class="profile-label" @click="handleProfileClick">My Profile</div>
    </div>

    <!-- Action Buttons (always visible) -->
    <div class="subtabs">
      <button class="subtab-button" @click="handleAddRecipe">
        + Add Recipe
      </button>
      <button class="subtab-button" @click="handleAddCollection">
        + Add Collection
      </button>
    </div>

    <!-- Conditional Search Section -->
    <div v-if="showSearch" class="search-section">
      <h3 class="section-heading">Search</h3>

      <!-- Recipe Title Search -->
      <div class="search-input-group">
        <label for="recipe-search">Recipe Title</label>
        <input
          id="recipe-search"
          v-model="recipeSearchQuery"
          type="text"
          placeholder="Search recipes..."
          class="search-input"
          @input="handleRecipeSearch"
        />
      </div>

      <!-- Ingredient Filter -->
      <div class="filter-group">
        <label for="ingredient-filter">Filter by Ingredients</label>
        <input
          id="ingredient-filter"
          v-model="ingredientFilterInput"
          type="text"
          placeholder="Add ingredient..."
          class="search-input"
          @keydown.enter="addIngredientFilter"
        />
      </div>

      <!-- Ingredient Chips Container -->
      <div class="ingredient-chips-container">
        <IngredientChip
          v-for="ingredient in selectedIngredients"
          :key="ingredient"
          :label="ingredient"
          @remove="removeIngredient(ingredient)"
        />
      </div>
    </div>

    <!-- Logout Button at Bottom (only when logged in) -->
    <div v-if="isLoggedIn" class="logout-section">
      <button @click="handleLogout" class="logout-button">Logout</button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "../composables/useAuth.js";
import IngredientChip from "./IngredientChip.vue";
import "./Sidebar.css";

const props = defineProps({
  showSearch: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "add-recipe",
  "add-collection",
  "recipe-search",
  "ingredient-filter-change",
  "profile-click",
  "home-click",
  "sign-in",
  "logout",
]);

const { isLoggedIn } = useAuth();

// Search state
const recipeSearchQuery = ref("");
const ingredientFilterInput = ref("");
const selectedIngredients = ref([]);

function handleSignIn() {
  emit("sign-in");
}

function handleProfileClick() {
  emit("profile-click");
}

function handleHomeClick() {
  emit("home-click");
}

function handleAddRecipe() {
  if (!isLoggedIn.value) {
    emit("sign-in");
    return;
  }
  emit("add-recipe");
}

function handleAddCollection() {
  if (!isLoggedIn.value) {
    emit("sign-in");
    return;
  }
  emit("add-collection");
}

function handleLogout() {
  emit("logout");
}

function handleRecipeSearch() {
  console.log("Sidebar - handleRecipeSearch called with:", recipeSearchQuery.value);
  emit("recipe-search", recipeSearchQuery.value);
}

function addIngredientFilter() {
  const ingredient = ingredientFilterInput.value.trim();
  if (ingredient && !selectedIngredients.value.includes(ingredient)) {
    selectedIngredients.value.push(ingredient);
    ingredientFilterInput.value = "";
    emit("ingredient-filter-change", selectedIngredients.value);
  }
}

function removeIngredient(ingredient) {
  selectedIngredients.value = selectedIngredients.value.filter(
    (item) => item !== ingredient
  );
  emit("ingredient-filter-change", selectedIngredients.value);
}
</script>
