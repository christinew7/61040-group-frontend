<template>
  <header class="app-header">
    <div class="header-left">
      <!-- Breadcrumbs -->
      <nav v-if="breadcrumbs.length > 0" class="breadcrumbs">
        <span v-for="(crumb, index) in breadcrumbs" :key="index" class="crumb-item">
          <router-link 
            v-if="crumb.route" 
            :to="crumb.route" 
            class="crumb-link"
          >
            {{ crumb.label }}
          </router-link>
          <span v-else class="crumb-text">{{ crumb.label }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
        </span>
      </nav>
      
      <!-- Page Title -->
      <h1 class="page-title">{{ title }}</h1>
    </div>

    <div class="header-right">
      <div v-if="isLoggedIn" class="user-info" @click="goToProfile">
        <span class="user-name">{{ displayName }}</span>
        <div class="avatar-circle">
          {{ userInitials }}
        </div>
      </div>
      <button v-else @click="$emit('sign-in')" class="btn-signin">
        Sign In
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useHeader } from '../composables/useHeader.js';
import { useAuth } from '../composables/useAuth.js';

const router = useRouter();
const { title, breadcrumbs } = useHeader();
const { isLoggedIn, user } = useAuth();

const displayName = computed(() => {
  return user.value?.displayName || user.value?.email?.split('@')[0] || 'User';
});

const userInitials = computed(() => {
  const name = displayName.value;
  return name.slice(0, 2).toUpperCase();
});

function goToProfile() {
  router.push('/profile');
}

defineEmits(['sign-in']);
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 2px solid var(--color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.crumb-link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;
}

.crumb-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.crumb-text {
  color: var(--color-text-dark);
  font-weight: 500;
}

.separator {
  margin: 0 0.5rem;
  color: #9ca3af;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  color: var(--color-primary);
  text-transform: lowercase;
  line-height: 1.2;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f3f4f6;
}

.user-name {
  font-weight: 600;
  color: var(--color-text-dark);
}

.avatar-circle {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.btn-signin {
  padding: 0.5rem 1.25rem;
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-signin:hover {
  background: var(--color-primary);
  color: white;
}
</style>
