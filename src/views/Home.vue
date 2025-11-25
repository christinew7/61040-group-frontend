<template>
  <div class="home-layout">
    <!-- login/logout button -->
    <div class="auth-header">
      <button v-if="!isLoggedIn" @click="showLogin = true" class="auth-button signin">
        Sign In
      </button>
      <div v-else class="auth-user">
        <span class="welcome-text">Welcome, <strong>{{ user?.displayName }}</strong>!</span>
        <button @click="handleLogout" class="auth-button logout">Logout</button>
      </div>
    </div>
    
    <Sidebar
      :showSearch="true"
      @add-recipe="handleAddRecipe"
      @add-collection="handleAddCollection"
      @recipe-search="handleRecipeSearch"
      @ingredient-filter-change="handleIngredientFilter"
      @profile-click="handleProfileClick"
    />

    <div class="home-view">
      <h2>Home</h2>

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

    <!-- Add Recipe Popup -->
    <AddRecipePopup
      :isOpen="isAddRecipePopupOpen"
      @close="closeAddRecipePopup"
      @submit="handleRecipeSubmit"
    />

    <!-- Add Collection Popup -->
    <AddCollectionPopup
      :isOpen="isAddCollectionPopupOpen"
      @close="closeAddCollectionPopup"
      @submit="handleCollectionSubmit"
    />
    <!-- Add LoginPopup -->
    <LoginPopup 
      :isOpen="showLogin" 
      @close="showLogin = false"
      @success="onLoginSuccess"
    />
    
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import LoginPopup from "../components/LoginPopup.vue";
import Sidebar from "../components/Sidebar.vue";
import RecipeDisplay from "../components/RecipeDisplay.vue";
import CollectionDisplay from "../components/CollectionDisplay.vue";
import AddRecipePopup from "../components/AddRecipePopup.vue";
import AddCollectionPopup from "../components/AddCollectionPopup.vue";

const { isLoggedIn, user, logout, init } = useAuth();
const showLogin = ref(false);

// Initialize auth on mount
onMounted(async () => {
  await init();
});

function onLoginSuccess() {
  console.log("Login successful!", user.value);
}

async function handleLogout() {
  await logout();
}

const router = useRouter();

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

// Popup state
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);

function handleAddRecipe() {
  console.log("Add recipe clicked");
  isAddRecipePopupOpen.value = true;
}

function closeAddRecipePopup() {
  isAddRecipePopupOpen.value = false;
}

function handleRecipeSubmit(recipeData) {
  console.log("Recipe submitted:", recipeData);
  // Here you would typically send the data to your backend API
  alert(`Recipe "${recipeData.name}" created successfully!`);
}

function handleAddCollection() {
  console.log("Add collection clicked");
  isAddCollectionPopupOpen.value = true;
}

function closeAddCollectionPopup() {
  isAddCollectionPopupOpen.value = false;
}

function handleCollectionSubmit(collectionData) {
  console.log("Collection submitted:", collectionData);
  // Here you would typically send the data to your backend API
  alert(`Collection "${collectionData.name}" created successfully!`);
}

function handleRecipeSearch(query) {
  console.log("Search recipes:", query);
  searchQuery.value = query;
}

function handleIngredientFilter(ingredients) {
  console.log("Filter by ingredients:", ingredients);
  ingredientFilters.value = ingredients;
}

function handleProfileClick() {
  router.push("/profile");
}

function onRecipeClick(recipe) {
  console.log("Recipe clicked:", recipe);
  // Navigate to recipe detail page
  router.push({
    name: "Recipe",
    params: { id: recipe._id },
    query: { recipe: encodeURIComponent(JSON.stringify(recipe)) },
  });
}

function onCollectionClick(collection) {
  console.log("Collection clicked:", collection);
  // Navigate to collection detail page
  router.push({
    name: "Collection",
    params: { id: collection._id },
    query: { name: collection.name },
  });
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

.auth-header {
  position: fixed;
  top: 1rem;
  right: 1.5rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.welcome-text {
  font-size: 0.95rem;
  color: var(--color-text-dark, #0f172a);
  padding-right: 1rem;
  border-right: 1px solid #e5e7eb;
}

.welcome-text strong {
  color: var(--color-primary);
}

.auth-button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-button.signin {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
}

.auth-button.signin:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.auth-button.logout {
  background: #f3f4f6;
  color: var(--color-text-dark, #0f172a);
  border: 1px solid #e5e7eb;
}

.auth-button.logout:hover {
  background: #e5e7eb;
}
</style>
