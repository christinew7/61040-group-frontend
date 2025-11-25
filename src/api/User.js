// src/api/User.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Different base URLs for different concepts
const userApi = axios.create({
  baseURL: `${API_BASE_URL}/User`,
  headers: { "Content-Type": "application/json" },
});

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/UserAuthentication`,
  headers: { "Content-Type": "application/json" },
});

const profileApi = axios.create({
  baseURL: `${API_BASE_URL}/Profile`,
  headers: { "Content-Type": "application/json" },
});

/**
 * @route POST api/User/register
 * @desc Register a new user account.
 * @returns {Promise<{token: string}>}
 */
export async function register(email, password, displayName) {
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof displayName !== "string"
  ) {
    throw new TypeError("Email, password, and display name must be strings.");
  }

  try {
    const response = await userApi.post("/register", {
      email,
      password,
      displayName,
    });
    return response.data; // { token }
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to register.");
  }
}

/**
 * @route POST api/UserAuthentication/login
 * @desc Log in an existing user.
 * @returns {Promise<{token: string}>}
 */
export async function login(email, password) {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new TypeError("Email and password must be strings.");
  }

  try {
    const response = await authApi.post("/login", { email, password });
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    return response.data; // { token }
  } catch (err) {
    // If axios error, extract message
    if (err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    // If our thrown error, pass through
    if (err.message) {
      throw err;
    }
    // Fallback
    throw new Error("Failed to login.");
  }
}

/**
 * @route POST api/UserAuthentication/logout
 * @desc End the current session.
 * @returns {Promise<boolean>}
 */
export async function logout(token) {
  if (typeof token !== "string") {
    throw new TypeError("Token is required.");
  }

  try {
    await authApi.post("/logout", { token });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to logout.");
  }
}

/**
 * @route POST api/Profile/getProfile
 * @desc Get current user profile details.
 * @returns {Promise<{userId: string, displayName: string}>}
 */
export async function getProfile(token) {
  if (typeof token !== "string") {
    throw new TypeError("Token is required.");
  }

  try {
    const response = await profileApi.post("/getProfile", { token });
    return response.data.profile;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to fetch profile.");
  }
}

/**
 * @route POST api/Profile/getProfile
 * @desc Get user profile by userId.
 * @returns {Promise<{userId: string, displayName: string}>}
 */
export async function getProfileByUserId(token, userId) {
  if (typeof token !== "string") {
    throw new TypeError("Token is required.");
  }
  if (typeof userId !== "string") {
    throw new TypeError("User ID is required.");
  }

  try {
    const response = await profileApi.post("/getProfile", { token, userId });

    console.log("getProfileByUserId response for", userId, ":", response.data);

    // Backend returns { profile: {...} } or { error: "..." }
    const result = response.data;

    if (result.error) {
      throw new Error(result.error);
    }
    
    if (result.profile) {
      return result.profile;
    }

    console.error("Unexpected response format:", result);
    throw new Error("Invalid response format from server");
  } catch (err) {
    if (err.message && !err.response) {
      throw err;
    }
    throw new Error(err.response?.data?.error || "Failed to fetch user info.");
  }
}

/**
 * @route POST api/Profile/updateDisplayName
 * @desc Change the user's display name.
 * @returns {Promise<boolean>}
 */
export async function updateDisplayName(token, displayName) {
  if (typeof token !== "string") {
    throw new TypeError("Token is required.");
  }
  if (typeof displayName !== "string" || !displayName.trim()) {
    throw new TypeError("Display name cannot be empty.");
  }

  try {
    await profileApi.post("/updateDisplayName", { token, displayName });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to update display name."
    );
  }
}

/**
 * @route POST api/UserAuthentication/updatePassword
 * @desc Change the user's password.
 * @returns {Promise<boolean>}
 */
export async function updatePassword(token, oldPassword, newPassword) {
  if (typeof token !== "string") {
    throw new TypeError("Token is required.");
  }
  if (typeof oldPassword !== "string" || typeof newPassword !== "string") {
    throw new TypeError("Passwords must be strings.");
  }

  try {
    await authApi.post("/updatePassword", { token, oldPassword, newPassword });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to update password.");
  }
}

/**
 * @route POST api/User/deleteAccount
 * @desc Permanently delete the user account (cascade handled by sync).
 * @returns {Promise<boolean>}
 */
export async function deleteAccount(token) {
  if (typeof token !== "string") {
    throw new TypeError("Token is required.");
  }

  try {
    await userApi.post("/deleteAccount", { token });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to delete account.");
  }
}
