<template>
  <div class="collection-layout">
    <Sidebar
      :showSearch="false"
      @add-recipe="handleAddRecipe"
      @add-collection="handleAddCollection"
      @profile-click="handleProfileClick"
      @home-click="handleHomeClick"
    />

    <!-- Main Content -->
    <div class="collection-content">
      <!-- Top Navbar with Collection Name -->
      <div class="collection-navbar">
        <h1>{{ collectionName }}</h1>
        <div class="collection-actions">
          <button @click="showAddMemberDialog" class="btn-action">
            + Add Member
          </button>
          <button @click="handleDeleteCollection" class="btn-action btn-danger">
            Delete Collection
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">Loading collection...</div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>Error loading collection: {{ error }}</p>
        <button @click="fetchCollectionDetails" class="btn-retry">Retry</button>
      </div>

      <!-- Collection Recipes -->
      <div v-else class="recipes-section">
        <div v-if="recipes.length > 0" class="recipes-grid">
          <RecipeDisplay
            v-for="recipe in recipes"
            :key="recipe._id"
            :recipe="recipe"
            @click="onRecipeClick"
          />
        </div>
        <p v-else class="empty-state">
          This collection doesn't have any recipes yet. Add some from the
          sidebar!
        </p>
      </div>
    </div>

    <!-- Add Recipe Popup -->
    <AddRecipePopup
      :isOpen="isAddRecipePopupOpen"
      :collections="userCollections"
      @close="closeAddRecipePopup"
      @submit="handleRecipeSubmit"
    />

    <!-- Add Collection Popup -->
    <AddCollectionPopup
      :isOpen="isAddCollectionPopupOpen"
      @close="closeAddCollectionPopup"
      @submit="handleCollectionSubmit"
    />

    <!-- Add Member Dialog -->
    <div
      v-if="isAddMemberDialogOpen"
      class="modal-overlay"
      @click="closeAddMemberDialog"
    >
      <div class="modal-content" @click.stop>
        <h2>Add Member to Collection</h2>
        <p>Enter the email address of the user you want to add:</p>
        <input
          v-model="newMemberEmail"
          type="email"
          placeholder="user@example.com"
          class="member-input"
          @keydown.enter="handleAddMember"
        />
        <div class="modal-actions">
          <button @click="handleAddMember" class="btn-primary">
            Add Member
          </button>
          <button @click="closeAddMemberDialog" class="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Sidebar from "../components/Sidebar.vue";
import RecipeDisplay from "../components/RecipeDisplay.vue";
import AddRecipePopup from "../components/AddRecipePopup.vue";
import AddCollectionPopup from "../components/AddCollectionPopup.vue";
import {
  viewCollection,
  getMyCollections,
  addItemToCollection,
  deleteCollection,
  addMemberToCollection,
} from "../api/Collecting.js";
import {
  createRecipe,
  getAllMyRecipes,
  parseIngredients,
} from "../api/Recipe.js";
import { useAuth } from "../composables/useAuth.js";

const router = useRouter();
const route = useRoute();
const { token } = useAuth();

// Collection data
const collectionId = ref(route.params.id);
const collectionName = ref("");
const recipes = ref([]);
const members = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Popup state
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);
const isAddMemberDialogOpen = ref(false);
const newMemberEmail = ref("");

// Collections data for recipe popup
const userCollections = ref([]);

// Helper function to get auth token
function getToken() {
  return token.value || "demo-token";
}

// Fetch collection details on mount
onMounted(async () => {
  await fetchCollectionDetails();
  await fetchCollections();
});

async function fetchCollections() {
  try {
    const authToken = getToken();
    const response = await getMyCollections(authToken);
    userCollections.value = response;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
  }
}

async function fetchCollectionDetails() {
  isLoading.value = true;
  error.value = null;

  try {
    const authToken = getToken();
    const data = await viewCollection(authToken, collectionId.value);

    // viewCollection returns { items: [...], members: [...] }
    // items are recipe IDs (strings), not full recipe objects
    const recipeIds = data.items || [];
    members.value = data.members || [];

    // Fetch all user's recipes
    const allRecipes = await getAllMyRecipes(authToken);

    // Filter to only show recipes that are in this collection
    recipes.value = allRecipes.filter((recipe) =>
      recipeIds.includes(recipe._id)
    );

    console.log("Collection recipe IDs:", recipeIds);
    console.log("Filtered recipes:", recipes.value);

    // Get collection name from route query or use a default
    collectionName.value = route.query.name || "Collection";
  } catch (err) {
    console.error("Failed to fetch collection details:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
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

function handleAddRecipe() {
  console.log("Add recipe clicked");
  isAddRecipePopupOpen.value = true;
}

function closeAddRecipePopup() {
  isAddRecipePopupOpen.value = false;
}

async function handleRecipeSubmit(recipeData) {
  try {
    const authToken = getToken();

    // Create the recipe - returns the recipe ID
    const recipeId = await createRecipe(
      authToken,
      recipeData.name,
      recipeData.link?.trim() || undefined,
      recipeData.description?.trim() || undefined,
      recipeData.image?.trim() || undefined
    );
    console.log("Recipe created with ID:", recipeId);

    // Add ingredients if provided
    if (recipeData.ingredientsText && recipeData.ingredientsText.trim()) {
      try {
        const ingredients = await parseIngredients(
          authToken,
          recipeId,
          recipeData.ingredientsText
        );
        console.log("Ingredients added:", ingredients);
      } catch (error) {
        console.error("Failed to add ingredients:", error);
      }
    }

    // Add the recipe to the selected collection if one was chosen
    if (recipeData.collection && recipeId) {
      try {
        await addItemToCollection(authToken, recipeData.collection, recipeId);
        console.log(`Added recipe to collection: ${recipeData.collection}`);
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert(`Recipe "${recipeData.name}" created successfully!`);

    // Refresh collection to show new recipe if it was added to this collection
    if (recipeData.collection === collectionId.value) {
      await fetchCollectionDetails();
    }
  } catch (error) {
    console.error("Failed to create recipe:", error);
    alert(`Failed to create recipe: ${error.message}`);
  }
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

function handleProfileClick() {
  router.push("/profile");
}

function handleHomeClick() {
  router.push("/");
}

function showAddMemberDialog() {
  isAddMemberDialogOpen.value = true;
  newMemberEmail.value = "";
}

function closeAddMemberDialog() {
  isAddMemberDialogOpen.value = false;
  newMemberEmail.value = "";
}

async function handleAddMember() {
  if (!newMemberEmail.value || !newMemberEmail.value.trim()) {
    alert("Please enter a valid email address");
    return;
  }

  try {
    const authToken = getToken();
    await addMemberToCollection(
      authToken,
      collectionId.value,
      newMemberEmail.value.trim()
    );
    alert(`Successfully added ${newMemberEmail.value} to the collection!`);
    closeAddMemberDialog();
    // Refresh collection to update members list
    await fetchCollectionDetails();
  } catch (error) {
    console.error("Failed to add member:", error);
    alert(`Failed to add member: ${error.message}`);
  }
}

async function handleDeleteCollection() {
  const confirmed = confirm(
    `Are you sure you want to delete "${collectionName.value}"? This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    const authToken = getToken();
    await deleteCollection(authToken, collectionId.value);
    alert(`Collection "${collectionName.value}" has been deleted.`);
    // Navigate back to profile page
    router.push("/profile");
  } catch (error) {
    console.error("Failed to delete collection:", error);
    alert(`Failed to delete collection: ${error.message}`);
  }
}
</script>

<style scoped>
.collection-layout {
  display: flex;
  min-height: 100vh;
}

.collection-content {
  flex: 1;
  background: #f9fafb;
}

/* Top Navbar */
.collection-navbar {
  background: white;
  border-bottom: 2px solid var(--color-primary);
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collection-navbar h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--color-primary);
  text-transform: lowercase;
}

.collection-actions {
  display: flex;
  gap: 1rem;
}

.btn-action {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-primary);
  color: white;
}

.btn-action:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-danger {
  background: #dc2626;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* Recipes Section */
.recipes-section {
  padding: 2rem;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 3rem 0;
}

.loading-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 3rem 2rem;
}

.error-state {
  text-align: center;
  padding: 2rem;
}

.error-state p {
  color: #dc2626;
  margin-bottom: 1rem;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: var(--color-primary-dark);
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h2 {
  margin: 0 0 1rem 0;
  color: var(--color-primary);
  font-size: 1.5rem;
}

.modal-content p {
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.member-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  box-sizing: border-box;
}

.member-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
