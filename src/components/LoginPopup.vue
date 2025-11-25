<template>
  <div v-if="isOpen" class="popup-overlay" @click.self="handleClose">
    <div class="popup-modal login-modal">
      <!-- Header -->
      <div class="popup-header">
        <h2>{{ isRegisterMode ? 'Create Account' : 'Welcome Back' }}</h2>
        <button class="close-button" @click="handleClose" aria-label="Close">
          ×
        </button>
      </div>

      <!-- Content -->
      <div class="popup-content">
        <form @submit.prevent="handleSubmit" class="login-form">
          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- Display Name (Register only) -->
          <div v-if="isRegisterMode" class="form-group">
            <label for="displayName">Display Name</label>
            <input
              id="displayName"
              v-model="formData.displayName"
              type="text"
              placeholder="Your name"
              class="form-input"
              required
            />
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="you@example.com"
              class="form-input"
              required
            />
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="••••••••"
              class="form-input"
              required
              minlength="8"
            />
            <p v-if="isRegisterMode" class="form-hint">
              Must be at least 8 characters
            </p>
          </div>

          <!-- Confirm Password (Register only) -->
          <div v-if="isRegisterMode" class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="••••••••"
              class="form-input"
              required
            />
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="submit-button"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Please wait...' : (isRegisterMode ? 'Create Account' : 'Sign In') }}
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="toggle-mode">
          <span v-if="isRegisterMode">
            Already have an account?
            <button @click="toggleMode" class="toggle-button">Sign In</button>
          </span>
          <span v-else>
            Don't have an account?
            <button @click="toggleMode" class="toggle-button">Create One</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useAuth } from "../composables/useAuth.js";
import "./LoginPopup.css";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "success"]);

const { login, register, isLoading } = useAuth();

const isRegisterMode = ref(false);
const errorMessage = ref("");

const formData = reactive({
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value;
  errorMessage.value = "";
  resetForm();
}

function resetForm() {
  formData.displayName = "";
  formData.email = "";
  formData.password = "";
  formData.confirmPassword = "";
}

async function handleSubmit() {
  errorMessage.value = "";

  // Validation
  if (isRegisterMode.value) {
    if (!formData.displayName.trim()) {
      errorMessage.value = "Display name is required";
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      errorMessage.value = "Passwords do not match";
      return;
    }
    if (formData.password.length < 8) {
      errorMessage.value = "Password must be at least 8 characters";
      return;
    }
  }

  // Submit
  let result;
  if (isRegisterMode.value) {
    result = await register(formData.email, formData.password, formData.displayName);
  } else {
    result = await login(formData.email, formData.password);
  }

  if (result.success) {
    emit("success");
    handleClose();
  } else {
    errorMessage.value = result.error;
  }
}

function handleClose() {
  emit("close");
  errorMessage.value = "";
  setTimeout(resetForm, 300);
}
</script>