// src/api/User.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create an Axios instance for the User concept
const api = axios.create({
  baseURL: `${API_BASE_URL}/User`,
  headers: { "Content-Type": "application/json" },
});

/**
 * @route POST api/User/register
 * @desc Register a new user account.
 */
export async function register(email, password, displayName) {
  if (typeof email !== "string" || typeof password !== "string" || typeof displayName !== "string") {
    throw new TypeError("Email, password, and display name must be strings.");
  }

  try {
    const response = await api.post("/register", { email, password, displayName });
    return response.data; // { userId, token }
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to register.");
  }
}

/**
 * @route POST api/User/login
 * @desc Log in an existing user.
 */
export async function login(email, password) {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new TypeError("Email and password must be strings.");
  }

  try {
    const response = await api.post("/login", { email, password });
    return response.data; // { token }
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to login.");
  }
}

/**
 * @route POST api/User/logout
 * @desc End the current session.
 */
export async function logout(token) {
  if (typeof token !== "string") throw new TypeError("Token is required.");

  try {
    await api.post("/logout", { token });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to logout.");
  }
}

/**
 * @route POST api/User/authenticate
 * @desc Verify token validity and refresh session expiry.
 */
export async function authenticate(token) {
  if (typeof token !== "string") throw new TypeError("Token is required.");

  try {
    const response = await api.post("/authenticate", { token });
    return response.data; // { userId }
  } catch (err) {
    throw new Error(err.response?.data?.error || "Session invalid or expired.");
  }
}

/**
 * @route POST api/User/me
 * @desc Get current user profile details.
 */
export async function getMe(token) {
    if (typeof token !== "string") throw new TypeError("Token is required.");

    try {
      const response = await api.post("/me", { token });
      return response.data.user;
    } catch (err) {
      throw new Error(err.response?.data?.error || "Failed to fetch profile.");
    }
  }

/**
 * @route POST api/User/updateDisplayName
 * @desc Change the user's display name.
 */
export async function updateDisplayName(token, displayName) {
  if (typeof token !== "string") throw new TypeError("Token is required.");
  if (typeof displayName !== "string" || !displayName.trim()) {
    throw new TypeError("Display name cannot be empty.");
  }

  try {
    await api.post("/updateDisplayName", { token, displayName });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to update display name.");
  }
}

/**
 * @route POST api/User/updatePassword
 * @desc Change the user's password.
 */
export async function updatePassword(token, oldPassword, newPassword) {
  if (typeof token !== "string") throw new TypeError("Token is required.");
  if (typeof oldPassword !== "string" || typeof newPassword !== "string") {
    throw new TypeError("Passwords must be strings.");
  }

  try {
    await api.post("/updatePassword", { token, oldPassword, newPassword });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to update password.");
  }
}

/**
 * @route POST api/User/deleteAccount
 * @desc Permanently delete the user account and sessions.
 */
export async function deleteAccount(token) {
  if (typeof token !== "string") throw new TypeError("Token is required.");

  try {
    await api.post("/deleteAccount", { token });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to delete account.");
  }
}
