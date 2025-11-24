<template>
  <div v-if="isOpen" class="popup-overlay" @click="handleOverlayClick">
    <div class="popup-container" @click.stop>
      <div class="popup-header">
        <h2>{{ title }}</h2>
      </div>

      <div class="popup-body">
        <p>{{ message }}</p>
      </div>

      <div class="popup-footer">
        <button @click="handleCancel" class="btn-cancel">
          {{ cancelText }}
        </button>
        <button @click="handleConfirm" class="btn-confirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import "./ConfirmationPopup.css";
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Confirm Action",
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: "Confirm",
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
});

const emit = defineEmits(["confirm", "cancel", "close"]);

function handleConfirm() {
  emit("confirm");
  emit("close");
}

function handleCancel() {
  emit("cancel");
  emit("close");
}

function handleOverlayClick() {
  emit("cancel");
  emit("close");
}
</script>
