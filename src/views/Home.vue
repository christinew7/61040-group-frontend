<template>
  <div class="home-layout">
    <Sidebar
      :showSearch="true"
      @add-recipe="handleAddRecipe"
      @add-collection="handleAddCollection"
      @recipe-search="handleRecipeSearch"
      @ingredient-filter-change="handleIngredientFilter"
    />

    <div class="home-view">
      <h2>Home</h2>
      <p>Welcome to the 61040 group frontend.</p>

      <section class="tester">
        <h3>RecipeDisplay tester</h3>
        <RecipeDisplay :recipe="sampleRecipe" @click="onRecipeClick" />
      </section>

      <section class="tester">
        <h3>CollectionDisplay tester</h3>
        <CollectionDisplay
          :collection="sampleCollection"
          @click="onCollectionClick"
        />
      </section>

      <!-- Debug output -->
      <section class="debug-section">
        <h3>Search & Filter State</h3>
        <p><strong>Recipe Search:</strong> {{ searchQuery || "(none)" }}</p>
        <p>
          <strong>Ingredient Filters:</strong>
          {{
            ingredientFilters.length ? ingredientFilters.join(", ") : "(none)"
          }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Sidebar from "../components/Sidebar.vue";
import RecipeDisplay from "../components/RecipeDisplay.vue";
import CollectionDisplay from "../components/CollectionDisplay.vue";

const sampleRecipe = ref({
  _id: "recipe-123",
  owner: "user-456",
  title: "Test Pancakes",
  ingredients: [
    { name: "1 cup flour" },
    { name: "1 egg" },
    { name: "1 cup milk" },
  ],
  image:
    "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop",
  description: "Fluffy homemade pancakes",
  isCopy: false,
});

const sampleCollection = ref({
  _id: "collection-789",
  owner: "user-456",
  name: "Breakfast Favorites",
  members: ["user-456", "user-789"],
  items: [
    {
      _id: "recipe-123",
      title: "Pancakes",
      image:
        "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&auto=format&fit=crop",
    },
    {
      _id: "recipe-456",
      title: "Waffles",
      image:
        "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800&auto=format&fit=crop",
    },
    {
      _id: "recipe-789",
      title: "French Toast",
    },
  ],
});

// Search and filter state
const searchQuery = ref("");
const ingredientFilters = ref([]);

function handleAddRecipe() {
  console.log("Add recipe clicked");
  alert("Add Recipe functionality would go here");
}

function handleAddCollection() {
  console.log("Add collection clicked");
  alert("Add Collection functionality would go here");
}

function handleRecipeSearch(query) {
  console.log("Search recipes:", query);
  searchQuery.value = query;
}

function handleIngredientFilter(ingredients) {
  console.log("Filter by ingredients:", ingredients);
  ingredientFilters.value = ingredients;
}

function onRecipeClick(recipe) {
  console.log("Recipe clicked:", recipe);
}

function onCollectionClick(collection) {
  console.log("Collection clicked:", collection);
}
</script>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
}

.home-view {
  flex: 1;
  max-width: 1200px;
  padding: 2rem;
}

.tester {
  margin-top: 1.5rem;
}

.tester h3 {
  margin-bottom: 0.75rem;
}

.debug-section {
  margin-top: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.debug-section h3 {
  margin-top: 0;
  font-size: 1rem;
  color: var(--color-primary);
}

.debug-section p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}
</style>
