import { ref, computed } from 'vue';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile } from '../api/User.js';

// Shared state (outside function so it's singleton)
const token = ref(localStorage.getItem("authToken") || null);
const user = ref(null);
const isLoading = ref(false);
const error = ref(null);

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value);

  async function login(email, password) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await apiLogin(email, password);
      token.value = response.token;
      localStorage.setItem("authToken", response.token);
      
      // Fetch user profile after login
      await fetchProfile();
      
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  async function register(email, password, displayName) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await apiRegister(email, password, displayName);
      token.value = response.token;
      localStorage.setItem("authToken", response.token);
      
      // Set user info from registration
      user.value = { displayName };
      
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    error.value = null;
    
    try {
      if (token.value) {
        await apiLogout(token.value);
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear local state even if API fails
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem("authToken");
      isLoading.value = false;
    }
  }

  async function fetchProfile() {
    if (!token.value) return;
    
    try {
      const profile = await getProfile(token.value);
      user.value = profile;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      // Token might be invalid - clear it
      if (err.message.includes("invalid") || err.message.includes("expired")) {
        token.value = null;
        user.value = null;
        localStorage.removeItem("authToken");
      }
    }
  }

  // Initialize: fetch profile if token exists
  async function init() {
    if (token.value && !user.value) {
      await fetchProfile();
    }
  }

  return {
    // State
    token,
    user,
    isLoading,
    error,
    isLoggedIn,
    
    // Actions
    login,
    register,
    logout,
    fetchProfile,
    init,
  };
}