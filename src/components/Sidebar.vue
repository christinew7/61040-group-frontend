<template>
  <aside class="sidebar">
    <!-- Title -->
    <div class="sidebar-title" @click="handleHomeClick">
      <h1>cooked!</h1>
    </div>

    <!-- Navigation Links -->
    <div class="profile-section">
      <div class="profile-label" @click="handleHomeClick">Home</div>
      <div v-if="isLoggedIn" class="profile-label" @click="handleProfileClick">My Profile</div>
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

      <!-- Pre-defined Ingredient Catalog -->
      <div class="chips-catalog">
        <h4 class="catalog-heading">Ingredient Library</h4>
        <div v-for="category in categories" :key="category" class="chip-category">
          <div class="category-name">{{ category }}</div>
          <div class="category-chips">
            <button
              v-for="chip in getChips(category)"
              :key="chip"
              :class="['chip', { 'chip-selected': isSelected(chip) }]"
              @click.prevent="toggleChip(chip)"
              type="button"
            >
              {{ chip }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "../composables/useAuth.js";
import IngredientChip from "./IngredientChip.vue";
import "./Sidebar.scss";
import chipsData from "../utils/chips.json";

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
  "sign-in"
]);

const { isLoggedIn } = useAuth();

// Search state
const recipeSearchQuery = ref("");
const ingredientFilterInput = ref("");
const selectedIngredients = ref([]);

// Chips/catalog from JSON
const categories = chipsData?.categories || [];

function getChips(category) {
  // chipsData has arrays keyed by category names
  return chipsData[category] || [];
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

function handleRecipeSearch() {
  console.log(
    "Sidebar - handleRecipeSearch called with:",
    recipeSearchQuery.value
  );
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

function isSelected(ingredient) {
  return selectedIngredients.value.includes(ingredient);
}

function toggleChip(ingredient) {
  const idx = selectedIngredients.value.indexOf(ingredient);
  if (idx === -1) {
    selectedIngredients.value.push(ingredient);
  } else {
    selectedIngredients.value.splice(idx, 1);
  }
  emit("ingredient-filter-change", selectedIngredients.value);
}

function removeIngredient(ingredient) {
  selectedIngredients.value = selectedIngredients.value.filter(
    (item) => item !== ingredient
  );
  emit("ingredient-filter-change", selectedIngredients.value);
}
</script>
