<template>
  <div class="ingredient-chip">
    <span class="chip-label">{{ label }}</span>
    <button
      class="chip-remove"
      @click="handleRemove"
      aria-label="Remove ingredient"
    >
      ×
    </button>
  </div>
</template>

<script setup>
import "./IngredientChip.css";

defineProps({
  label: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["remove"]);

function handleRemove() {
  emit("remove");
}
</script>
