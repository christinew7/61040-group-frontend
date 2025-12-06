<template>
  <div class="collection-layout">
    <!-- Main Content -->
    <div class="collection-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">Loading collection...</div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>Error loading collection: {{ error }}</p>
        <button @click="fetchCollectionDetails" class="btn-retry">Retry</button>
      </div>

      <!-- Collection Recipes -->
      <div v-else class="recipes-section">
        <!-- View Members Button and Dropdown -->
        <div class="members-section">
          <button @click="toggleMembersDropdown" class="btn-view-members">
            {{ isMembersDropdownOpen ? "▼" : "▶" }} View Members ({{
              members.length
            }})
          </button>

          <!-- Members Dropdown -->
          <div v-if="isMembersDropdownOpen" class="members-dropdown">
            <h3>Collection Members</h3>
            <div v-if="members.length > 0" class="members-list">
              <div
                v-for="member in members"
                :key="member.userId || member._id || member"
                class="member-item"
              >
                <span class="member-name">{{
                  getMemberDisplayName(member)
                }}</span>
                <span
                  v-if="getMemberUserId(member) === collectionOwner"
                  class="owner-badge"
                  >Owner</span
                >
              </div>
            </div>
            <p v-else class="empty-members">
              No members in this collection yet.
            </p>
          </div>
        </div>

        <div v-if="recipes.length > 0" class="recipes-grid">
          <RecipeDisplay
            v-for="recipe in filteredRecipes"
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
      @submitParsed="handleParsedRecipeSubmit"
    />

    <!-- Add Collection Popup -->
    <AddCollectionPopup
      :isOpen="isAddCollectionPopupOpen"
      :recipes="recipes"
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

    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="message success-message">
      ✓ {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div v-if="showErrorMessage" class="message error-message">
      ✗ {{ errorMessage }}
    </div>

    <!-- Confirmation Popup -->
    <ConfirmationPopup
      :isOpen="showConfirmPopup"
      :title="confirmPopupConfig.title"
      :message="confirmPopupConfig.message"
      :confirmText="confirmPopupConfig.confirmText"
      :cancelText="confirmPopupConfig.cancelText"
      @confirm="confirmPopupConfig.onConfirm"
      @close="closeConfirmPopup"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onActivated } from "vue";
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
  leaveCollection,
} from "../api/Collecting.js";
import {
  createRecipe,
  getAllMyRecipes,
  getAllRecipesGlobal,
  parseIngredients,
  setImage,
  getRecipeById,
} from "../api/Recipe.js";
import { getProfileByUserId } from "../api/User.js";
import { useAuth } from "../composables/useAuth.js";
import { useHeader } from "../composables/useHeader.js";
import { useAppSearch } from "../composables/useAppSearch.js";
import ConfirmationPopup from "../components/ConfirmationPopup.vue";

const router = useRouter();
const route = useRoute();
const { token, logout, user, init } = useAuth();
const { setTitle, setBreadcrumbs, setActions } = useHeader();
const { searchQuery, ingredientFilters } = useAppSearch();

// Collection data
const collectionId = ref(route.params.id);
const collectionName = ref("");
const collectionOwner = ref("");
const recipes = ref([]);
const members = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Computed property for filtered recipes based on search and ingredient filters
const filteredRecipes = computed(() => {
  let filtered = recipes.value;

  // Filter by search query (title or description)
  if (searchQuery.value?.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    filtered = filtered.filter((recipe) => {
      const matchesTitle = recipe.title?.toLowerCase().includes(query);
      const matchesDescription = recipe.description
        ?.toLowerCase()
        .includes(query);
      return matchesTitle || matchesDescription;
    });
  }

  // Filter by ingredients
  if (ingredientFilters.value?.length > 0) {
    filtered = filtered.filter((recipe) => {
      if (!recipe.ingredients || recipe.ingredients.length === 0) return false;

      // Check if recipe has ALL selected ingredients
      return ingredientFilters.value.every((filterIngredient) => {
        const filterName = filterIngredient.toLowerCase();
        return recipe.ingredients.some((recipeIngredient) => {
          const ingredientName = recipeIngredient.name?.toLowerCase() || "";
          return (
            ingredientName.includes(filterName) ||
            filterName.includes(ingredientName)
          );
        });
      });
    });
  }

  return filtered;
});

// Computed property to check if current user is the collection owner
const isOwner = computed(() => {
  return user.value?.userId === collectionOwner.value;
});

// Popup state
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);
const isAddMemberDialogOpen = ref(false);
const isMembersDropdownOpen = ref(false);
const newMemberEmail = ref("");

// Confirmation popup state
const showConfirmPopup = ref(false);
const confirmPopupConfig = ref({
  title: "",
  message: "",
  confirmText: "",
  cancelText: "Cancel",
  onConfirm: () => {},
});

// Collections data for recipe popup
const userCollections = ref([]);

//short term sucess/error message
const showSuccessMessage = ref(false);
const successMessage = ref("");
const showErrorMessage = ref(false);
const errorMessage = ref("");

// Helper function to get auth token
function getToken() {
  return token.value;
}

// Fetch collection details on mount
onMounted(async () => {
  // Initialize auth (fetch user profile if not already loaded)
  await init();

  await fetchCollectionDetails();
  await fetchUserCollections();
});

// Refetch when navigating back to this page or when collection ID changes
onActivated(async () => {
  await fetchCollectionDetails();
});

// Watch for collection ID changes in route
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      collectionId.value = newId;
      await fetchCollectionDetails();
    }
  }
);

async function fetchUserCollections() {
  if (!token.value) return;

  try {
    const authToken = getToken();
    const collections = await getMyCollections(authToken);
    userCollections.value = collections;
  } catch (error) {
    console.error("Failed to fetch user collections:", error);
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

async function fetchCollectionDetails() {
  isLoading.value = true;
  error.value = null;

  try {
    const authToken = getToken();
    const data = await viewCollection(authToken, collectionId.value);

    console.log("Collection data:", data);

    // Backend returns { items: [...recipeIds...], members: [...] }
    const recipeIds = data.items || [];
    const memberIds = data.members || [];

    console.log("Collection recipe IDs:", recipeIds);
    console.log("Number of recipe IDs:", recipeIds.length);
    console.log("Collection member IDs:", memberIds);

    // Fetch each recipe by ID using the public passthrough route
    const recipePromises = recipeIds.map((recipeId) =>
      getRecipeById(recipeId)
        .then((response) => {
          // Response is an array with { recipe } or { error }
          if (response && response.length > 0 && response[0].recipe) {
            return response[0].recipe;
          }
          console.warn(`Recipe ${recipeId} not found or has error`);
          return null;
        })
        .catch((err) => {
          console.error(`Failed to fetch recipe ${recipeId}:`, err);
          return null;
        })
    );

    const fetchedRecipes = await Promise.all(recipePromises);
    recipes.value = fetchedRecipes.filter((recipe) => recipe !== null);

    console.log(
      `Successfully fetched ${recipes.value.length} out of ${recipeIds.length} recipes`
    );

    // Fetch member details if we have member IDs
    if (memberIds.length > 0) {
      const memberDetails = await Promise.all(
        memberIds.map(async (memberId) => {
          try {
            // If it's already an object with displayName, return it
            if (typeof memberId === "object" && memberId.displayName) {
              return memberId;
            }
            // Fetch user profile using public passthrough (no token needed)
            const profile = await getProfileByUserId(memberId);
            return {
              userId: memberId,
              displayName: profile?.displayName || null,
            };
          } catch (error) {
            console.error(`Failed to fetch profile for ${memberId}:`, error);
            return {
              userId: memberId,
              displayName: null,
            };
          }
        })
      );
      members.value = memberDetails;
      console.log("Fetched member details:", members.value);
    } else {
      members.value = [];
    }

    // Get collection name from route query or use a default
    collectionName.value = route.query.name || "Collection";

    setTitle(collectionName.value);
    setBreadcrumbs([
      { label: "My Profile", route: "/profile" },
      { label: collectionName.value },
    ]);
    collectionOwner.value = route.query.owner || "";

    console.log("Collection owner:", collectionOwner.value);
    console.log("Current user object:", user.value);
    console.log("Current user ID:", user.value?.id);
    console.log("Current user _id:", user.value?._id);
    console.log("Is owner:", isOwner.value);

    // Set header actions
    const actions = [
      {
        label: "+ Add Member",
        onClick: showAddMemberDialog,
      },
    ];

    if (isOwner.value) {
      // Owner can delete
      actions.push({
        label: "Delete Collection",
        onClick: handleDeleteCollection,
        variant: "danger",
      });
    } else {
      // Non-owner can leave
      actions.push({
        label: "Leave Collection",
        onClick: handleLeaveCollection,
        variant: "danger",
      });
    }

    setActions(actions);
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
    query: {
      owner: recipe.owner,
      title: recipe.title,
      recipe: JSON.stringify(recipe),
      from: "collection",
      collectionId: collectionId.value,
      collectionName: collectionName.value,
    },
  });
}

function showAddMemberDialog() {
  isAddMemberDialogOpen.value = true;
  newMemberEmail.value = "";
}

function closeAddMemberDialog() {
  isAddMemberDialogOpen.value = false;
  newMemberEmail.value = "";
}

function toggleMembersDropdown() {
  isMembersDropdownOpen.value = !isMembersDropdownOpen.value;
}

async function handleAddMember() {
  if (!newMemberEmail.value || !newMemberEmail.value.trim()) {
    showError("Please enter a valid email address");
    return;
  }

  try {
    const authToken = getToken();
    await addMemberToCollection(
      authToken,
      collectionId.value,
      newMemberEmail.value.trim()
    );
    showSuccess(
      `Successfully added ${newMemberEmail.value} to the collection!`
    );
    closeAddMemberDialog();
    // Refresh collection to update members list
    await fetchCollectionDetails();
  } catch (error) {
    console.error("Failed to add member:", error);
    showError(`Failed to add member: ${error.message}`);
  }
}

function handleDeleteCollection() {
  confirmPopupConfig.value = {
    title: "Delete Collection",
    message: `Are you sure you want to delete "${collectionName.value}"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    onConfirm: confirmDeleteCollection,
  };
  showConfirmPopup.value = true;
}

async function confirmDeleteCollection() {
  try {
    await deleteCollection(token.value, collectionId.value);
    showSuccess(`Collection "${collectionName.value}" has been deleted.`);

    setTimeout(() => {
      router.push("/profile");
    }, 1500);
  } catch (error) {
    console.error("Failed to delete collection:", error);
    showError(`Failed to delete collection: ${error.message}`);
  }
}

function handleLeaveCollection() {
  confirmPopupConfig.value = {
    title: "Leave Collection",
    message: `Are you sure you want to leave "${collectionName.value}"?`,
    confirmText: "Leave",
    cancelText: "Cancel",
    onConfirm: confirmLeaveCollection,
  };
  showConfirmPopup.value = true;
}

async function confirmLeaveCollection() {
  try {
    await leaveCollection(token.value, collectionId.value);
    showSuccess(`You have left "${collectionName.value}"`);

    setTimeout(() => {
      router.push("/profile");
    }, 1500);
  } catch (error) {
    console.error("Failed to leave collection:", error);
    showError(`Failed to leave collection: ${error.message}`);
  }
}

function closeConfirmPopup() {
  showConfirmPopup.value = false;
}

async function handleLogout() {
  await logout();
  router.push("/");
}

async function handleRecipeSubmit(recipeData) {
  if (!token.value) {
    showError("Please sign in to create a recipe");
    return;
  }

  try {
    // Create recipe
    const recipeId = await createRecipe(
      token.value,
      recipeData.name,
      recipeData.link?.trim() || undefined,
      recipeData.description?.trim() || undefined
    );
    console.log("Recipe created with ID:", recipeId);

    // Set image separately if provided
    if (recipeData.image?.trim()) {
      try {
        await setImage(token.value, recipeId, recipeData.image);
        console.log("Image set successfully");
      } catch (error) {
        console.error("Failed to set image:", error);
      }
    }

    // Add ingredients if provided
    if (recipeData.ingredientsText && recipeData.ingredientsText.trim()) {
      try {
        const ingredients = await parseIngredients(
          token.value,
          recipeId,
          recipeData.ingredientsText
        );
        console.log("Ingredients added:", ingredients);
      } catch (error) {
        console.error("Failed to add ingredients:", error);
      }
    }

    // Add to collection if selected
    if (recipeData.collection && recipeId) {
      try {
        await addItemToCollection(token.value, recipeData.collection, recipeId);
        console.log(`Added recipe to collection: ${recipeData.collection}`);
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    showSuccess(`Recipe "${recipeData.name}" created successfully!`);

    // Always refresh collection details to show potentially new recipe
    await fetchCollectionDetails();
    await fetchUserCollections();
  } catch (error) {
    console.error("Failed to create recipe:", error);
    showError(`Failed to create recipe: ${error.message}`);
  }
}

async function handleParsedRecipeSubmit(submissionData) {
  if (!token.value) {
    showError("Please sign in to create a recipe");
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

    showSuccess("Recipe created successfully from link!");

    // Always refresh collection details to show potentially new recipe
    await fetchCollectionDetails();
    await fetchUserCollections();
  } catch (error) {
    console.error("Failed to update parsed recipe:", error);
    showError(`Failed to update recipe: ${error.message}`);
  }
}

function closeAddRecipePopup() {
  isAddRecipePopupOpen.value = false;
}

function closeAddCollectionPopup() {
  isAddCollectionPopupOpen.value = false;
}

function handleCollectionSubmit(collectionData) {
  console.log("Collection submitted:", collectionData);
  showSuccess(`Collection "${collectionData.name}" created successfully!`);
}

// Helper functions for member display
function getMemberDisplayName(member) {
  // If member is a string (just user ID), return shortened version
  if (typeof member === "string") {
    return `User ${member.substring(0, 8)}...`;
  }
  // If displayName is null or empty, show shortened userId
  if (!member?.displayName) {
    const userId = member?.userId || member?._id || "unknown";
    return `User ${userId.substring(0, 8)}...`;
  }
  // Otherwise show displayName or email
  return member.displayName || member.email || "Unknown User";
}

function getMemberUserId(member) {
  // If member is a string, it is the user ID
  if (typeof member === "string") {
    return member;
  }
  // If member is an object, get userId or _id
  const userId = member?.userId || member?._id || member;
  console.log(
    "getMemberUserId for",
    member,
    "->",
    userId,
    "comparing with owner:",
    collectionOwner.value
  );
  return userId;
}
</script>

<style scoped>
.collection-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.collection-content {
  flex: 1;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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

/* Members Dropdown */
.members-section {
  margin-bottom: 2rem;
}

.btn-view-members {
  padding: 0.75rem 1.5rem;
  background: white;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-view-members:hover {
  background: var(--color-primary);
  color: white;
}

.members-dropdown {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(2, 142, 65, 0.2);
}

.members-dropdown h3 {
  margin: 0 0 1rem 0;
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f3f4f6;
}

.member-name {
  color: #374151;
  font-size: 0.95rem;
  font-weight: 500;
}

.owner-badge {
  background: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-members {
  color: #9ca3af;
  font-size: 0.95rem;
  text-align: center;
  padding: 1rem;
  margin: 0;
}

/* Short term success/error message */
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
</style>
