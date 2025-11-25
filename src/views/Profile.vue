<template>
  <div class="profile-content">
    <!-- My Account Section -->
    <section class="account-section">
      <h2>My Account</h2>

      <div class="account-item">
        <label for="display-name">Displayed Name</label>
        <div class="display-name-group">
          <input
            id="display-name"
            v-model="displayName"
            type="text"
            class="name-input"
            :disabled="!isEditingName"
          />
          <button
            v-if="!isEditingName"
            @click="enableNameEdit"
            class="btn-edit"
          >
            Edit
          </button>
          <button
            v-else
            @click="saveDisplayName"
            class="btn-save"
            :disabled="isSaving"
          >
            {{ isSaving ? "Saving..." : "Save" }}
          </button>
        </div>
        <!-- Edit name messages -->
        <p v-if="saveSuccess" class="success-name-edit">
          ✓ Display name updated!
        </p>
        <p v-if="saveError" class="error-name-edit">✗ {{ saveError }}</p>
      </div>

      <div class="account-actions">
        <button @click="handleLogout" class="btn-logout">Logout</button>
        <button @click="handleDeleteAccount" class="btn-delete">
          Delete Account
        </button>
      </div>
    </section>

    <!-- Collections Section -->
    <section class="collections-section">
      <h2>My Collections</h2>

      <div v-if="isLoadingCollections" class="loading-state">
        Loading collections...
      </div>

      <div v-else-if="collectionsError" class="error-state">
        <p>Error loading collections: {{ collectionsError }}</p>
        <button @click="fetchCollections" class="btn-retry">Retry</button>
      </div>

      <div v-else>
        <div v-if="userCollections.length > 0" class="collections-grid">
          <CollectionDisplay
            v-for="collection in userCollections"
            :key="collection._id"
            :collection="collection"
            @click="onCollectionClick"
          />
        </div>
        <p v-else class="empty-state">
          You don't have any collections yet. Create one from the sidebar!
        </p>
      </div>
    </section>

    <!-- My Recipes Section -->
    <section class="recipes-section">
      <h2>My Recipes</h2>

      <div v-if="isLoadingRecipes" class="loading-state">
        Loading recipes...
      </div>

      <div v-else-if="recipesError" class="error-state">
        <p>Error loading recipes: {{ recipesError }}</p>
        <button @click="fetchRecipes" class="btn-retry">Retry</button>
      </div>

      <div v-else>
        <div v-if="userRecipes.length > 0" class="recipes-grid">
          <RecipeDisplay
            v-for="recipe in userRecipes"
            :key="recipe._id"
            :recipe="recipe"
            @click="onRecipeClick"
          />
        </div>
        <p v-else class="empty-state">
          You haven't created any recipes yet. Add one from the sidebar!
        </p>
      </div>
    </section>

    <!-- Delete Account Confirmation Popup -->
    <ConfirmationPopup
      :isOpen="isDeleteConfirmOpen"
      title="Delete Account"
      message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
      confirmText="Delete Account"
      cancelText="Cancel"
      @confirm="confirmDeleteAccount"
      @close="closeDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import { useHeader } from "../composables/useHeader.js";
import CollectionDisplay from "../components/CollectionDisplay.vue";
import ConfirmationPopup from "../components/ConfirmationPopup.vue";
import { getMyCollections } from "../api/Collecting.js";
import { getAllMyRecipes } from "../api/Recipe.js";
import { getProfile, updateDisplayName, deleteAccount } from "../api/User.js";
import RecipeDisplay from "../components/RecipeDisplay.vue";

const router = useRouter();
const { token, user, logout } = useAuth();
const { setTitle, setBreadcrumbs } = useHeader();

// for display name
const isSaving = ref(false);
const saveSuccess = ref(false);
const saveError = ref(null);

// Popup state
const isDeleteConfirmOpen = ref(false);

// User account data
const displayName = ref("");
const originalDisplayName = ref("");
const isEditingName = ref(false);

// Collections data
const userCollections = ref([]);
const isLoadingCollections = ref(false);
const collectionsError = ref(null);

// Recipes data
const userRecipes = ref([]);
const isLoadingRecipes = ref(false);
const recipesError = ref(null);

onMounted(async () => {
  setTitle("my profile");
  setBreadcrumbs([]);
  // Fetch fresh profile data from API
  try {
    const authToken = getToken();
    const profile = await getProfile(authToken);
    displayName.value = profile.displayName || "";
    originalDisplayName.value = profile.displayName || "";
  } catch (error) {
    console.error("Failed to load profile:", error);
    // Fallback to user from auth state
    if (user.value) {
      displayName.value = user.value.displayName || "";
      originalDisplayName.value = user.value.displayName || "";
    }
  }
  // Fetch user collections on mount
  await fetchCollections();
  await fetchRecipes(); // user's own recipes
});

// Helper function to get auth token
function getToken() {
  return token.value;
}

async function fetchCollections() {
  isLoadingCollections.value = true;
  collectionsError.value = null;

  try {
    const authToken = getToken();
    const response = await getMyCollections(authToken);
    userCollections.value = response;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    collectionsError.value = error.message;
  } finally {
    isLoadingCollections.value = false;
  }
}

async function fetchRecipes() {
  isLoadingRecipes.value = true;
  recipesError.value = null;

  try {
    const authToken = token.value;
    const recipes = await getAllMyRecipes(authToken);
    userRecipes.value = (recipes || []).reverse(); // newest recipe first
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    recipesError.value = err.message;
  } finally {
    isLoadingRecipes.value = false;
  }
}

function enableNameEdit() {
  isEditingName.value = true;
}

async function saveDisplayName() {
  if (!displayName.value.trim()) {
    saveError.value = "Display name cannot be empty";
    return;
  }

  isSaving.value = true;
  saveError.value = null;
  saveSuccess.value = false;

  try {
    const authToken = getToken();
    await updateDisplayName(authToken, displayName.value);
    originalDisplayName.value = displayName.value;
    isEditingName.value = false;
    saveSuccess.value = true;

    // Hide success message after 3 seconds
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (error) {
    console.error("Failed to update display name:", error);
    saveError.value = error.message;
    displayName.value = originalDisplayName.value;
  } finally {
    isSaving.value = false;
  }
}

function handleLogout() {
  logout();
  router.push("/"); // Redirect to home or login page after logout
}

function handleDeleteAccount() {
  isDeleteConfirmOpen.value = true;
}

async function confirmDeleteAccount() {
  try {
    const authToken = getToken();
    await deleteAccount(authToken);
    await logout();

    // Close confirmation popup
    isDeleteConfirmOpen.value = false;

    // Redirect to home
    router.push("/");

    // Optional: Show a success message on home page
    // (You'd need to pass this via route state or a global toast system)
  } catch (error) {
    console.error("Failed to delete account:", error);

    // Close popup and show error inline
    isDeleteConfirmOpen.value = false;
    alert(`Failed to delete account: ${error.message}`);
  }
}

function closeDeleteConfirm() {
  isDeleteConfirmOpen.value = false;
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

function onRecipeClick(recipe) {
  router.push({
    name: "Recipe",
    params: { id: recipe._id },
    query: {
      owner: recipe.owner,
      title: recipe.title,
      from: 'profile'
    },
  });
}
</script>

<style scoped>
.profile-content {
  flex: 1;
  background: #f9fafb;
  /* Ensure it takes full height */
  min-height: 100%;
}

.profile-content {
  flex: 1;
  background: #f9fafb;
}

/* Account Section */
.account-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.account-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: var(--color-text-dark, #0f172a);
}

.account-item {
  margin-bottom: 1.5rem;
}

.account-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text-dark, #0f172a);
}

.display-name-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.name-input {
  flex: 1;
  max-width: 400px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.name-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.name-input:disabled {
  background: #f9fafb;
  color: #6b7280;
}

.btn-edit,
.btn-save {
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

.btn-edit:hover,
.btn-save:hover {
  background: var(--color-primary-dark);
}

.account-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn-logout,
.btn-delete {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout {
  background: #f3f4f6;
  color: var(--color-text-dark, #0f172a);
}

.btn-logout:hover {
  background: #e5e7eb;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
}

.success-edit-name {
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  border-radius: 6px;
  color: #065f46;
  font-size: 0.875rem;
  animation: slideIn 0.3s ease-out;
}

.error-edit-name {
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Collections Section */
.collections-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 0 2rem 2rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.collections-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: var(--color-text-dark, #0f172a);
}

.collections-grid {
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
  padding: 3rem 0;
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

/* Recipes Section */
.recipes-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 0 2rem 2rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recipes-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: var(--color-text-dark, #0f172a);
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>
