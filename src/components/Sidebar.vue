<template>
  <aside class="sidebar">
    <!-- Title -->
    <div class="sidebar-title">
      <h1>cooked!</h1>
    </div>

    <!-- My Profile Section with Subtabs -->
    <div class="profile-section">
      <div class="profile-label">My Profile</div>

      <div class="subtabs">
        <button class="subtab-button" @click="handleAddRecipe">
          + Add Recipe
        </button>
        <button class="subtab-button" @click="handleAddCollection">
          + Add Collection
        </button>
      </div>
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
  </aside>
</template>

<script setup>
import { ref } from "vue";
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
]);

// Search state
const recipeSearchQuery = ref("");
const ingredientFilterInput = ref("");
const selectedIngredients = ref([]);

function handleAddRecipe() {
  emit("add-recipe");
}

function handleAddCollection() {
  emit("add-collection");
}

function handleRecipeSearch() {
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
