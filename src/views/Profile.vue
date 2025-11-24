<template>
  <div class="profile-layout">
    <Sidebar
      :showSearch="false"
      @add-recipe="handleAddRecipe"
      @add-collection="handleAddCollection"
      @profile-click="handleProfileClick"
    />

    <!-- Main Content -->
    <div class="profile-content">
      <!-- Top Navbar -->
      <div class="profile-navbar">
        <h1>my profile</h1>
      </div>
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
            <button v-else @click="saveDisplayName" class="btn-save">
              Save
            </button>
          </div>
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
import Sidebar from "../components/Sidebar.vue";
import CollectionDisplay from "../components/CollectionDisplay.vue";
import AddRecipePopup from "../components/AddRecipePopup.vue";
import AddCollectionPopup from "../components/AddCollectionPopup.vue";
import ConfirmationPopup from "../components/ConfirmationPopup.vue";
import { getMyCollections } from "../api/Collecting.js";

const router = useRouter();

// Popup state
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);
const isDeleteConfirmOpen = ref(false);

// User account data
const displayName = ref("John Doe");
const isEditingName = ref(false);

// Collections data
const userCollections = ref([]);
const isLoadingCollections = ref(false);
const collectionsError = ref(null);

// Fetch user collections on mount
onMounted(async () => {
  await fetchCollections();
});

async function fetchCollections() {
  isLoadingCollections.value = true;
  collectionsError.value = null;

  try {
    // TODO: Replace with actual token from your auth system
    const token = localStorage.getItem("authToken") || "demo-token";
    const collections = await getMyCollections(token);
    userCollections.value = collections;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    collectionsError.value = error.message;
  } finally {
    isLoadingCollections.value = false;
  }
}

function enableNameEdit() {
  isEditingName.value = true;
}

function saveDisplayName() {
  isEditingName.value = false;
  // TODO: Send update to backend API
  console.log("Saved display name:", displayName.value);
  alert("Display name updated!");
}

function handleLogout() {
  // TODO: Call logout API and redirect to login
  alert("Account would be logged out, logout api!");
}

function handleDeleteAccount() {
  isDeleteConfirmOpen.value = true;
}

function confirmDeleteAccount() {
  console.log("Deleting account...");
  // TODO: Call delete account API
  alert("Account would be deleted, call api!");
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

function handleProfileClick() {
  // Already on profile page, so do nothing or scroll to top
  console.log("Already on profile page");
}
</script>

<style scoped>
.profile-layout {
  display: flex;
  min-height: 100vh;
}

.profile-content {
  flex: 1;
  background: #f9fafb;
}

/* Top Navbar */
.profile-navbar {
  background: white;
  border-bottom: 2px solid var(--color-primary);
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.profile-navbar h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--color-primary);
  text-transform: lowercase;
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
</style>
