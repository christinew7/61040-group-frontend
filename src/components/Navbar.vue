<template>
  <div class="navbar">
    <h1>{{ title }}</h1>
    <button @click="handleBack" class="profile-button" title="Go to Profile">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </button>
  </div>
</template>

<script setup>
import "./NavBar.css";
import { useRouter } from "vue-router";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});

const router = useRouter();

function handleBack() {
  router.push("/profile");
}
</script>
