<template>
  <div class="collection-display" @click="handleClick">
    <div class="image-container">
      <img :src="imageUrl" alt="Collection preview" class="preview-image" />
    </div>
    <div class="text-preview">
      <h3 class="collection-title">{{ collectionName }}</h3>
      <p class="collection-subtitle">{{ itemCount }}</p>
    </div>
  </div>
</template>

<script setup>
import "./CollectionDisplay.css";
import { computed } from "vue";

const props = defineProps({
  collection: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["click"]);

const handleClick = () => {
  emit("click", props.collection);
};

const imageUrl = computed(() => {
  // Collecting concept doesn't have an image in its state, so use the image in the first recipe or a fallback placeorder
  if (props.collection?.items && props.collection.items.length > 0) {
    const firstItem = props.collection.items[0];
    if (firstItem?.image) {
      return firstItem.image;
    }
  }
  // TODO: find a better placeholder image?
  return "https://placehold.co/600x400/e2e8f0/64748b?text=Collection";
});

const collectionName = computed(() => {
  return props.collection?.name || "Untitled Collection";
});

const itemCount = computed(() => {
  const count = props.collection?.items?.length || 0;
  return `${count} item${count !== 1 ? "s" : ""}`;
});
</script>
