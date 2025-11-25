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
      <DropdownMenu v-if="isLoggedIn">
        <template #trigger>
          <div class="user-info">
            <span class="user-name">{{ displayName }}</span>
            <div class="avatar-circle">
              {{ userInitials }}
            </div>
          </div>
        </template>
        <template #menu="{ close }">
          <div class="menu-item" @click="goToProfile(close)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            My Profile
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item logout" @click="handleLogout(close)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </div>
        </template>
      </DropdownMenu>
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
import DropdownMenu from './DropdownMenu.vue';

const router = useRouter();
const { title, breadcrumbs } = useHeader();
const { isLoggedIn, user, logout } = useAuth();

const displayName = computed(() => {
  return user.value?.displayName || user.value?.email?.split('@')[0] || 'User';
});

const userInitials = computed(() => {
  const name = displayName.value;
  return name.slice(0, 2).toUpperCase();
});

function goToProfile(close) {
  close();
  router.push('/profile');
}

async function handleLogout(close) {
  close();
  await logout();
  router.push('/');
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
  z-index: 20;
  position: relative;
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
  padding: 6px 12px;
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

.menu-item {
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-dark);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  margin: 0 8px;
  border-radius: 4px;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.logout {
  color: #dc2626;
}

.menu-item.logout:hover {
  background: #fee2e2;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
}

.icon {
  color: inherit;
  display: block;
}
</style>
