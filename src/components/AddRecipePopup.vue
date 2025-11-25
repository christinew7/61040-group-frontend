<template>
  <div v-if="isOpen" class="popup-overlay" @click.self="handleClose">
    <div class="popup-modal">
      <!-- Header -->
      <div class="popup-header">
        <h2>Add Recipe</h2>
        <button class="close-button" @click="handleClose" aria-label="Close">
          ×
        </button>
      </div>

      <!-- Single scrollable form with all steps -->
      <div class="popup-content">
        <div class="all-steps-form">
          <!-- Step 1: Recipe Name -->
          <div class="form-section">
            <h3>1. Recipe Name *</h3>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Enter recipe name..."
              class="form-input"
            />
          </div>

          <!-- Step 2: Description -->
          <div class="form-section">
            <h3>2. Description</h3>
            <textarea
              v-model="formData.description"
              placeholder="Describe your recipe..."
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <!-- Step 3: Add Link -->
          <div class="form-section">
            <h3>3. Add Link</h3>
            <input
              v-model="formData.link"
              type="url"
              placeholder="https://example.com/recipe"
              class="form-input"
            />
          </div>

          <!-- Step 4: Add Image -->
          <div class="form-section">
            <h3>4. Add Image</h3>
            <div class="image-input-group">
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="imageInputType"
                  value="url"
                  name="imageType"
                />
                <span>Image URL</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  v-model="imageInputType"
                  value="upload"
                  name="imageType"
                />
                <span>Upload Image</span>
              </label>
            </div>

            <!-- Image URL Input -->
            <div v-if="imageInputType === 'url'" class="input-container">
              <input
                v-model="formData.image"
                type="url"
                placeholder="https://example.com/image.jpg"
                class="form-input"
              />
            </div>

            <!-- Image Upload Input -->
            <div v-else class="input-container">
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="form-input file-input"
              />
              <p v-if="uploadedFileName" class="file-name">
                Selected: {{ uploadedFileName }}
              </p>
            </div>

            <p class="form-hint">Optional: Add an image for your recipe</p>
          </div>

          <!-- Step 5: Add to Collection -->
          <div class="form-section">
            <h3>5. Add to Collection</h3>
            <select v-model="formData.collection" class="form-select">
              <option value="">-- Select a collection --</option>
              <option
                v-for="collection in collections"
                :key="collection._id"
                :value="collection._id"
              >
                {{ collection.name }}
              </option>
            </select>
            <p class="form-hint">Optional: Add this recipe to a collection</p>
          </div>

          <!-- Step 6: Add Ingredients -->
          <div class="form-section">
            <h3>6. Add Ingredients</h3>
            <textarea
              v-model="formData.ingredientsText"
              placeholder="Enter one ingredient per line in format: quantity, unit, name&#10;Example:&#10;1, cup, flour&#10;2, tablespoons, sugar&#10;0.5, teaspoon, salt"
              class="form-textarea"
              rows="8"
            ></textarea>
            <p class="form-hint">
              Format: <code>quantity, unit, name</code> (one per line)<br />
              Example: <code>1, cup, flour</code>
            </p>
          </div>
        </div>
      </div>

      <!-- Footer with submit button -->
      <div class="popup-footer">
        <button @click="submitRecipe" class="nav-button primary">
          Create Recipe
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import "./AddRecipePopup.css";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  collections: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "submit"]);

const imageInputType = ref("url");
const uploadedFileName = ref("");

const formData = ref({
  name: "",
  description: "",
  link: "",
  image: "",
  collection: "",
  ingredientsText: "",
});

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadedFileName.value = file.name;

    // Convert image to base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.image = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function handleClose() {
  emit("close");
  // Reset form after a delay
  setTimeout(() => {
    imageInputType.value = "url";
    uploadedFileName.value = "";
    formData.value = {
      name: "",
      description: "",
      link: "",
      image: "",
      collection: "",
      ingredientsText: "",
    };
  }, 300);
}

function submitRecipe() {
  console.log("Submitting recipe data:", formData.value);
  emit("submit", formData.value);
  handleClose();
}
</script>
