<template>
  <div class="recipe-display" @click="handleClick">
    <div class="image-container">
      <img :src="imageUrl" alt="Preview Recipe Image" class="preview-image" />
    </div>
    <div class="text-preview">
      <h3 class="recipe-title">{{ title }}</h3>
    </div>
  </div>
</template>

<script setup>
import "./RecipeDisplay.css";
import { computed } from "vue";

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["click"]);

const handleClick = () => {
  emit("click", props.recipe);
};

const imageUrl = computed(() => {
  if (props.recipe?.image) {
    return props.recipe.image;
  }
  // Fallback placeholder image
  // TODO: send in an image that is just a fork and knife . some more food related default image
  return "https://via.placeholder.com/600x400?text=No+Image";
});

const title = computed(() => {
  return props.recipe?.title || "Untitled Recipe";
});
</script>
