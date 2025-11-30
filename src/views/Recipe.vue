<template>
  <div class="recipe-layout">
    <!-- Main Content -->
    <div class="recipe-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">Loading recipe...</div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>Error loading recipe: {{ error }}</p>
        <button @click="fetchRecipeDetails" class="btn-retry">Retry</button>
      </div>

      <!-- Recipe Details -->
      <div v-else class="recipe-details">
        <!-- Recipe Header with Image -->
        <div class="recipe-header">
          <div class="recipe-image-container">
            <img
              :src="recipe.image || defaultImage"
              :alt="recipe.title"
              class="recipe-image"
            />
          </div>
          <div class="recipe-title-section">
            <h1 class="recipe-title">{{ recipe.title }}</h1>
            <div v-if="recipe.link" class="recipe-link-container">
              <a
                :href="recipe.link"
                target="_blank"
                rel="noopener noreferrer"
                class="recipe-link"
              >
                🔗 View Original Recipe
              </a>
            </div>

            <!-- Recipe Actions (logged in only) -->
            <div v-if="isLoggedIn" class="recipe-actions">
              <!-- Owner-only actions -->
              <template v-if="isOwner">
                <button @click="handleEditRecipe" class="btn-action btn-edit">
                  Edit
                </button>
                <button
                  @click="handleDeleteRecipe"
                  class="btn-action btn-delete"
                >
                  Delete
                </button>
              </template>

              <!-- Non-owner actions only -->
              <template v-if="!isOwner">
                <button @click="handleCopyRecipe" class="btn-action btn-copy">
                  Copy Recipe
                </button>
              </template>

              <!-- Actions for all logged-in users -->
              <button
                @click="handleAddToCollection"
                class="btn-action btn-collection"
              >
                Add to Collection
              </button>
            </div>
          </div>
        </div>

        <!-- Recipe Description -->
        <section v-if="recipe.description" class="recipe-section">
          <h2>Description</h2>
          <p class="recipe-description">{{ recipe.description }}</p>
        </section>

        <!-- Ingredients List -->
        <section class="recipe-section">
          <h2>Ingredients</h2>
          <div v-if="recipe.ingredients && recipe.ingredients.length > 0">
            <ul class="ingredients-list">
              <li
                v-for="(ingredient, index) in recipe.ingredients"
                :key="index"
                class="ingredient-item"
              >
                <span v-if="ingredient.quantity !== -1 && ingredient.quantity !== null && ingredient.quantity !== undefined" class="ingredient-quantity">
                  {{ ingredient.quantity }}
                </span>
                <span v-if="ingredient.unit" class="ingredient-unit">
                  {{ ingredient.unit }}
                </span>
                <span class="ingredient-name">
                  {{ ingredient.name }}
                </span>
              </li>
            </ul>
          </div>
          <p v-else class="empty-state">No ingredients listed yet.</p>
        </section>
      </div>

      <!-- Add Recipe Popup -->
      <AddRecipePopup
        :isOpen="isAddRecipePopupOpen"
        :collections="userCollections"
        @close="closeAddRecipePopup"
        @submit="handleRecipeSubmit"
        @submitParsed="handleParsedRecipeSubmit"
      />

      <!-- Add Collection Popup -->
      <AddCollectionPopup
        :isOpen="isAddCollectionPopupOpen"
        @close="closeAddCollectionPopup"
        @submit="handleCollectionSubmit"
      />

      <!-- Add to Collection Modal -->
      <div
        v-if="showCollectionModal"
        class="modal-overlay"
        @click.self="closeCollectionModal"
      >
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add to Collection</h3>
            <button @click="closeCollectionModal" class="close-button">
              &times;
            </button>
          </div>

          <div class="modal-body">
            <div v-if="collectionsWithStatus.length === 0" class="empty-state">
              You don't have any collections yet. Create one first!
            </div>

            <div v-else class="collection-list">
              <label
                v-for="collection in collectionsWithStatus"
                :key="collection._id"
                class="collection-checkbox"
              >
                <input
                  type="checkbox"
                  :checked="collection.hasItem"
                  @change="toggleCollection(collection)"
                />
                <span>{{ collection.name }}</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeCollectionModal" class="btn-done">Done</button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteModal"
        class="modal-overlay"
        @click.self="cancelDelete"
      >
        <div class="modal-content delete-modal">
          <div class="modal-header">
            <h3>Delete Recipe</h3>
            <button @click="cancelDelete" class="close-button">&times;</button>
          </div>

          <div class="modal-body">
            <p class="delete-warning">
              Are you sure you want to delete "<strong>{{
                recipe.title
              }}</strong
              >"?
            </p>
            <p class="delete-subtext">This action cannot be undone.</p>
          </div>

          <div class="modal-footer delete-footer">
            <button @click="cancelDelete" class="btn-cancel">Cancel</button>
            <button
              @click="confirmDelete"
              class="btn-confirm-delete"
              :disabled="isDeleting"
            >
              {{ isDeleting ? "Deleting..." : "Delete Recipe" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Recipe Modal -->
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-content edit-modal">
          <div class="modal-header">
            <h3>Edit Recipe</h3>
            <button @click="closeEditModal" class="close-button">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label for="edit-title">Title</label>
              <input 
                id="edit-title" 
                type="text" 
                :value="recipe.title" 
                disabled 
                class="form-input disabled"
              />
              <span class="helper-text">Title cannot be changed</span>
            </div>
            
            <div class="form-group">
              <label for="edit-description">Description</label>
              <textarea 
                id="edit-description" 
                v-model="editForm.description" 
                class="form-input"
                rows="3"
                placeholder="Add a description..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="edit-link">Recipe Link</label>
              <input 
                id="edit-link" 
                type="url" 
                v-model="editForm.link" 
                class="form-input"
                placeholder="https://..."
              />
            </div>
            
            <div class="form-group">
              <label for="edit-image">Image URL</label>
              <input 
                id="edit-image" 
                type="url" 
                v-model="editForm.image" 
                class="form-input"
                placeholder="https://..."
              />
              <div v-if="editForm.image" class="image-preview">
                <img :src="editForm.image" alt="Preview" />
              </div>
            </div>
            <div class="form-group">
              <label for="edit-public">Visibility</label>
              <div style="display:flex; gap:1rem; align-items:center">
                <label style="display:flex; align-items:center; gap:0.5rem">
                  <input type="radio" id="edit-public" name="visibility" v-model="editForm.isPublic" :value="true" />
                  <span>Public</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem">
                  <input type="radio" id="edit-private" name="visibility" v-model="editForm.isPublic" :value="false" />
                  <span>Private</span>
                </label>
              </div>
              <span class="helper-text">Public recipes are visible to others; private recipes are only visible to you.</span>
            </div>

            <div class="form-group">
              <label for="edit-ingredients">Ingredients</label>
              <textarea 
                id="edit-ingredients" 
                v-model="editForm.ingredientsText" 
                class="form-input"
                rows="6"
                placeholder="One ingredient per line:
            1, cup, flour
            2,, eggs
            1, tsp, vanilla"
              ></textarea>
              <span class="helper-text">Format: quantity, unit, name (one per line)</span>
            </div>
          </div>
          
          <div class="modal-footer">
            <button @click="closeEditModal" class="btn-cancel">Cancel</button>
            <button @click="submitEdit" class="btn-save" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="message success-message">
        ✓ {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div v-if="showErrorMessage" class="message error-message">
        ✗ {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Sidebar from "../components/Sidebar.vue";
import AddRecipePopup from "../components/AddRecipePopup.vue";
import AddCollectionPopup from "../components/AddCollectionPopup.vue";
import {
  getRecipe,
  deleteRecipe,
  copyRecipe,
  viewRecipe,
  setImage,
  createRecipe,
  setRecipePublic,
  setDescription,
  setLink,
  removeLink,
  deleteImage,
  parseIngredients,
  deleteIngredient,
  removeDescription,
} from "../api/Recipe.js";
import {
  getMyCollections,
  addItemToCollection,
  removeItemFromCollection,
} from "../api/Collecting.js";
import { useAuth } from "../composables/useAuth.js";
import { useHeader } from "../composables/useHeader.js";

const router = useRouter();
const route = useRoute();
const { token, isLoggedIn, user, logout } = useAuth();
const { setTitle, setBreadcrumbs, setActions } = useHeader();

// Recipe data
const recipe = ref({
  _id: "",
  title: "",
  description: "",
  link: "",
  image: "",
  ingredients: [],
});
const isLoading = ref(false);
const error = ref(null);

// Is current user the owner?
const isOwner = computed(() => {
  return user.value?.userId === recipe.value?.owner;
});

// Collection modal state
const showCollectionModal = ref(false);
const collectionsWithStatus = ref([]);
const isLoadingCollections = ref(false);

// Popup state
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);
const userCollections = ref([]);

//Delete modal state
const showDeleteModal = ref(false);
const isDeleting = ref(false);

const showSuccessMessage = ref(false);
const successMessage = ref("");
const showErrorMessage = ref(false);
const errorMessage = ref("");

//Edit modal state
const showEditModal = ref(false);
const isSaving = ref(false);
const editForm = ref({
  description: "",
  link: "",
  image: "",
  ingredientsText: "",
  isPublic: false,
});



const defaultImage = "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";

// Fetch recipe details on mount
onMounted(async () => {
  await fetchRecipeDetails();
  await fetchCollections();
});

async function fetchCollections() {
  if (!token.value) return; // Skip if not logged in

  try {
    const response = await getMyCollections(token.value);
    userCollections.value = response;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
  }
}

function showSuccess(message) {
  successMessage.value = message;
  showSuccessMessage.value = true;

  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 3000);
}

function showError(message) {
  errorMessage.value = message;
  showErrorMessage.value = true;

  setTimeout(() => {
    showErrorMessage.value = false;
  }, 5000);
}

async function fetchRecipeDetails() {
  isLoading.value = true;
  error.value = null;

  try {
    // First, try to get recipe from query params (passed from collection/profile)
    if (route.query.recipe) {
      try {
        recipe.value = JSON.parse(decodeURIComponent(route.query.recipe));
        isLoading.value = false;
        return;
      } catch (parseErr) {
        console.error("Failed to parse recipe from query params:", parseErr);
        // Continue to API fallback
      }
    }

    // Fallback: Try to fetch from API using owner and title
    const owner = route.query.owner;
    const title = route.query.title;

    if (!owner || !title) {
      throw new Error(
        "Recipe information missing. Please navigate from your profile or collections."
      );
    }

    // Use public getRecipe (no auth needed)
    const data = await getRecipe(owner, title);

    // Extract recipe from response
    let recipes = data;
    if (Array.isArray(recipes) && recipes.length > 0) {
      recipes = recipes[0];
    }
    if (recipes.recipes) {
      recipes = recipes.recipes;
    }

    recipe.value = Array.isArray(recipes) ? recipes[0] : recipes;

    setTitle("recipe");
    setActions([]);

    // Determine breadcrumbs based on context
    const from = route.query.from;
    let breadcrumbs = [];

    if (from === "profile") {
      breadcrumbs = [
        { label: "My Profile", route: "/profile" },
        { label: recipe.value.title },
      ];
    } else if (from === "collection") {
      const collectionId = route.query.collectionId;
      const collectionName = route.query.collectionName || "Collection";
      breadcrumbs = [
        { label: "My Profile", route: "/profile" },
        {
          label: collectionName,
          route: {
            name: "Collection",
            params: { id: collectionId },
            query: { name: collectionName },
          },
        },
        { label: recipe.value.title },
      ];
    } else {
      // Default to Home
      breadcrumbs = [
        { label: "Home", route: "/" },
        { label: recipe.value.title },
      ];
    }

    setBreadcrumbs(breadcrumbs);

  } catch (err) {
    console.error("Failed to fetch recipe details:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

// --- DELETE RECIPE (owner only) ---
function handleDeleteRecipe() {
  showDeleteModal.value = true;
}

async function confirmDelete() {
  isDeleting.value = true;

  try {
    await deleteRecipe(token.value, recipe.value._id);
    showDeleteModal.value = false;
    showSuccess("Recipe deleted!");

    setTimeout(() => {
      router.push("/profile");
    }, 1500);
  } catch (err) {
    console.error("Failed to delete recipe:", err);
    showError(`Failed to delete: ${err.message}`);
    showDeleteModal.value = false;
  } finally {
    isDeleting.value = false;
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
}

// --- COPY RECIPE (all logged-in users) ---
async function handleCopyRecipe() {
  try {
    const newRecipeId = await copyRecipe(token.value, recipe.value._id);
    showSuccess("Recipe copied to your recipes!");

    setTimeout(() => {
      router.push("/profile");
    }, 1500);
  } catch (err) {
    console.error("Failed to copy recipe:", err);
    showError(`Failed to copy: ${err.message}`);
  }
}

// --- EDIT RECIPE (owner only) ---
function handleEditRecipe() {
  // Pre-fill form with current values
  // Convert ingredients array to text format - ALWAYS include all 3 parts
  const ingredientsText = (recipe.value.ingredients || [])
    .map(ing => {
      const quantity = (ing.quantity === -1) ? "" : (ing.quantity ?? "");
      const unit = ing.unit ?? "";
      const name = ing.name ?? "";
      return `${quantity}, ${unit}, ${name}`;
    })
    .join("\n");

  editForm.value = {
    description: recipe.value.description || "",
    link: recipe.value.link || "",
    image: recipe.value.image || "",
    ingredientsText: ingredientsText,
    isPublic: (typeof recipe.value.isPublic === 'boolean') ? recipe.value.isPublic : (recipe.value.public ?? false),
  };
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
}

async function submitEdit() {
  // Validation: must have link OR description
  if (!editForm.value.link?.trim() && !editForm.value.description?.trim()) {
    showError("Recipe must have either a link or description");
    return;
  }

  isSaving.value = true;
  
  try {
    // Update description if changed
    const originalDescription = recipe.value.description || "";
    const newDescription = editForm.value.description?.trim() || "";

    if (newDescription !== originalDescription) {
      if (newDescription) {
        await setDescription(token.value, recipe.value._id, newDescription);
      } else {
        await removeDescription(token.value, recipe.value._id);
      }
    }
    
    // Update link if changed
    if (editForm.value.link !== (recipe.value.link || "")) {
      if (editForm.value.link) {
        await setLink(token.value, recipe.value._id, editForm.value.link);
      } else {
        await removeLink(token.value, recipe.value._id);
      }
    }
    
    // Update image if changed
    if (editForm.value.image !== (recipe.value.image || "")) {
      if (editForm.value.image) {
        await setImage(token.value, recipe.value._id, editForm.value.image);
      } else {
        await deleteImage(token.value, recipe.value._id);
      }
    }
    // Update visibility if changed
    const originalIsPublic = (typeof recipe.value.isPublic === 'boolean') ? recipe.value.isPublic : (recipe.value.public ?? false);
    if (editForm.value.isPublic !== originalIsPublic) {
      try {
        await setRecipePublic(token.value, recipe.value._id, Boolean(editForm.value.isPublic));
      } catch (err) {
        console.error('Failed to update recipe visibility:', err);
      }
    }
    
    // Update ingredients if changed
    // FIXED: Always use "quantity, unit, name" format even if unit is empty
    const originalIngredientsText = (recipe.value.ingredients || [])
      .map(ing => {
        const quantity = (ing.quantity === -1) ? "" : (ing.quantity ?? "");
        const unit = ing.unit ?? "";
        const name = ing.name ?? "";
        return `${quantity}, ${unit}, ${name}`;
      })
      .join("\n");
    
    if (editForm.value.ingredientsText !== originalIngredientsText) {
      
      // Delete all existing ingredients first
      for (const ingredient of (recipe.value.ingredients || [])) {
        try {
          await deleteIngredient(token.value, ingredient._id);
        } catch (err) {
          console.error("Failed to delete ingredient:", ingredient._id, err.message);
        }
      }
      
      // Add new ingredients
      if (editForm.value.ingredientsText.trim()) {

        // Normalize ingredients: convert blank quantities to -1
        const normalizedEdit = editForm.value.ingredientsText
          .split("\n")
          .map((line) => {
            const parts = line.split(",");
            const quantityRaw = (parts[0] || "").trim();
            const quantity = quantityRaw === "" ? "-1" : quantityRaw;
            const unit = (parts[1] || "").trim();
            const name = parts.slice(2).join(",").trim();
            return `${quantity}, ${unit}, ${name}`;
          })
          .join("\n");

        await parseIngredients(
          token.value,
          recipe.value._id,
          normalizedEdit
        );
      }
    }
    
    // Clear the cached recipe from query params so we fetch fresh
    if (route.query.recipe) {
      router.replace({
        ...route,
        query: {
          ...route.query,
          recipe: undefined
        }
      });
    }

    // Refresh recipe data
    await fetchRecipeDetails();
    
    showEditModal.value = false;
    showSuccess("Recipe updated!");
  } catch (err) {
    console.error("Failed to update recipe:", err);
    showError(`Failed to update: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
}

// --- ADD TO COLLECTION (all logged-in users) ---
async function handleAddToCollection() {
  isLoadingCollections.value = true;

  try {
    const data = await viewRecipe(
      token.value,
      recipe.value.owner,
      recipe.value.title
    );
    collectionsWithStatus.value = data.collectionsWithStatus || [];
    showCollectionModal.value = true;
  } catch (err) {
    console.error("Failed to load collections:", err);
    alert(`Failed to load collections: ${err.message}`);
  } finally {
    isLoadingCollections.value = false;
  }
}

// Toggle recipe in/out of collection
async function toggleCollection(collection) {
  try {
    if (collection.hasItem) {
      await removeItemFromCollection(
        token.value,
        collection._id,
        recipe.value._id
      );
      collection.hasItem = false;
      showSuccess(`Removed from "${collection.name}"`);
    } else {
      await addItemToCollection(token.value, collection._id, recipe.value._id);
      collection.hasItem = true;
      showSuccess(`Added to "${collection.name}"`);
    }
  } catch (err) {
    console.error("Failed to update collection:", err);
    showError(`Failed to update: ${err.message}`);
  }
}

function closeCollectionModal() {
  showCollectionModal.value = false;
}

function handleAddRecipe() {
  isAddRecipePopupOpen.value = true;
}

function closeAddRecipePopup() {
  isAddRecipePopupOpen.value = false;
}

async function handleRecipeSubmit(recipeData) {
  if (!token.value) {
    alert("Please sign in to create a recipe");
    return;
  }

  try {
    // Create recipe WITHOUT image
    const recipeId = await createRecipe(
      token.value,
      recipeData.name,
      recipeData.link?.trim() || undefined,
      recipeData.description?.trim() || undefined,
      Boolean(recipeData.isPublic)
    );

    // Set image separately if provided
    if (recipeData.image?.trim()) {
      try {
        await setImage(token.value, recipeId, recipeData.image);
      } catch (error) {
        console.error("Failed to set image:", error);
      }
    }

    // Add ingredients if provided
    if (recipeData.ingredientsText && recipeData.ingredientsText.trim()) {
      try {
        // Normalize ingredients: convert blank quantities to -1
        const normalized = recipeData.ingredientsText
          .split("\n")
          .map((line) => {
            const parts = line.split(",");
            const quantityRaw = (parts[0] || "").trim();
            const quantity = quantityRaw === "" ? "-1" : quantityRaw;
            const unit = (parts[1] || "").trim();
            const name = parts.slice(2).join(",").trim();
            return `${quantity}, ${unit}, ${name}`;
          })
          .join("\n");

        await parseIngredients(token.value, recipeId, normalized);
      } catch (error) {
        console.error("Failed to add ingredients:", error);
      }
    }

    // Add to collection if selected
    if (recipeData.collection && recipeId) {
      try {
        await addItemToCollection(token.value, recipeData.collection, recipeId);
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert(`Recipe "${recipeData.name}" created successfully!`);
  } catch (error) {
    console.error("Failed to create recipe:", error);
    alert(`Failed to create recipe: ${error.message}`);
  }
}

async function handleParsedRecipeSubmit(submissionData) {
  if (!token.value) {
    alert("Please sign in to create a recipe");
    return;
  }

  try {
    const { parsedRecipeId, image, collection } = submissionData;

    // Set image if provided
    if (image?.trim()) {
      try {
        await setImage(token.value, parsedRecipeId, image);
        console.log("Image set successfully");
      } catch (error) {
        console.error("Failed to set image:", error);
      }
    }

    // Add to collection if selected
    if (collection && parsedRecipeId) {
      try {
        await addItemToCollection(token.value, collection, parsedRecipeId);
        console.log(`Added recipe to collection: ${collection}`);
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert("Recipe created successfully from link!");
  } catch (error) {
    console.error("Failed to update parsed recipe:", error);
    alert(`Failed to update recipe: ${error.message}`);
  }
}

function handleAddCollection() {
  isAddCollectionPopupOpen.value = true;
}

function closeAddCollectionPopup() {
  isAddCollectionPopupOpen.value = false;
}

function handleCollectionSubmit(collectionData) {
  alert(`Collection "${collectionData.name}" created successfully!`);
}

function handleProfileClick() {
  router.push("/profile");
}

function handleHomeClick() {
  router.push("/");
}

function handleLogout() {
  logout();
  router.push("/");
}
</script>

<style scoped>
.recipe-content {
  flex: 1;
  background: #f9fafb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Recipe Details */
.recipe-details {
  padding: 2rem;
  flex: 1;
}

/* Recipe Header */
.recipe-header {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recipe-image-container {
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-title-section {
  padding: 2rem;
}

.recipe-title {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  color: var(--color-text-dark, #0f172a);
  text-transform: capitalize;
}

.recipe-link-container {
  margin-top: 1rem;
}

.recipe-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.2s;
}

.recipe-link:hover {
  background: var(--color-primary-dark);
}

/* Recipe Sections */
.recipe-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recipe-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 0.5rem;
}

.recipe-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--color-text-dark, #0f172a);
  margin: 0;
}

/* Ingredients List */
.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow: visible;
  max-height: none;
}

.ingredient-item {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
  font-size: 1.125rem;
  display: flex;
  gap: 0.375rem;
  align-items: baseline;
}

.ingredient-quantity {
  font-weight: 600;
  color: var(--color-primary);
  flex-shrink: 0;
}

.ingredient-unit {
  color: var(--color-text-dark, #0f172a);
  flex-shrink: 0;
}

.ingredient-name {
  color: var(--color-text-dark, #0f172a);
  flex: 1;
}

/* States */
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
  font-size: 1.125rem;
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

.empty-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 2rem 0;
}

/* Recipe Actions */
.recipe-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-action {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #dbeafe;
  color: #1d4ed8;
}
.btn-edit:hover {
  background: #bfdbfe;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}
.btn-delete:hover {
  background: #fecaca;
}

.btn-copy {
  background: #f3e8ff;
  color: #7c3aed;
}
.btn-copy:hover {
  background: #e9d5ff;
}

.btn-collection {
  background: #d1fae5;
  color: #059669;
}
.btn-collection:hover {
  background: #a7f3d0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  flex: 1;
}

.collection-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.collection-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
}

.collection-checkbox:hover {
  background: #f3f4f6;
}

.collection-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-done {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-done:hover {
  background: var(--color-primary-dark);
}

.delete-modal {
  max-width: 400px;
}

.delete-warning {
  font-size: 1.1rem;
  color: var(--color-text-dark, #0f172a);
  margin: 0 0 0.5rem 0;
}

.delete-subtext {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.delete-footer {
  display: flex;
  gap: 1rem;
}

.btn-cancel {
  flex: 1;
  padding: 0.75rem;
  background: #f3f4f6;
  color: var(--color-text-dark, #0f172a);
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm-delete {
  flex: 1;
  padding: 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm-delete:hover {
  background: #b91c1c;
}

.btn-confirm-delete:disabled {
  background: #f87171;
  cursor: not-allowed;
}

/* Short term success message */

.message {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
  z-index: 1000;
}

.success-message {
  background: #059669;
  color: white;
}

.error-message {
  background: #dc2626;
  color: white;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Edit Modal*/
.edit-modal {
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text-dark, #0f172a);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;  
}


.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input.disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.helper-text {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.image-preview {
  margin-top: 0.75rem;
  border-radius: 6px;
  overflow: hidden;
  max-height: 150px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 2rem;  
  border-top: 1px solid #e5e7eb;
}

.btn-save {
  flex: 1;
  padding: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:hover {
  background: var(--color-primary-dark);
}

.btn-save:disabled {
  background: #f3a683;
  cursor: not-allowed;
}

.btn-cancel {
  flex: 1;
  padding: 0.75rem;
  background: #f3f4f6;
  color: var(--color-text-dark, #0f172a);
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #e5e7eb;
}
</style>
