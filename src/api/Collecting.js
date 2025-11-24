// src/api/Collecting.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create an Axios instance for the Collecting concept
const api = axios.create({
  baseURL: `${API_BASE_URL}/Collecting`,
  headers: { "Content-Type": "application/json" },
});

/**
 * @route POST api/Collecting/create
 * @desc Create a new collection (folder).
 * @returns {Promise<string>} The ID of the new collection.
 */
export async function createCollection(token, name) {
  if (typeof token !== "string" || typeof name !== "string") {
    throw new TypeError("Token and name must be strings.");
  }

  try {
    const response = await api.post("/create", { token, name });
    return response.data.collection;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to create collection."
    );
  }
}

/**
 * @route POST api/Collecting/delete
 * @desc Delete a collection (Owner only).
 */
export async function deleteCollection(token, collectionId) {
  if (typeof token !== "string" || typeof collectionId !== "string") {
    throw new TypeError("Token and collection ID must be strings.");
  }

  try {
    await api.post("/delete", { token, collection: collectionId });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to delete collection."
    );
  }
}

/**
 * @route POST api/Collecting/rename
 * @desc Rename a collection (Owner only).
 */
export async function renameCollection(token, collectionId, newName) {
  if (
    typeof token !== "string" ||
    typeof collectionId !== "string" ||
    typeof newName !== "string"
  ) {
    throw new TypeError("Invalid inputs for renaming collection.");
  }

  try {
    await api.post("/rename", { token, collection: collectionId, newName });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to rename collection."
    );
  }
}

/**
 * @route POST api/Collecting/getMyCollections
 * @desc Get all collections the user owns or is a member of.
 * @returns {Promise<Array>} List of collection documents.
 */
export async function getMyCollections(token) {
  if (typeof token !== "string") throw new TypeError("Token must be a string.");

  try {
    const response = await api.post("/getMyCollections", { token });
    return response.data.collections;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to fetch collections."
    );
  }
}

/**
 * @route POST api/Collecting/viewCollection
 * @desc Get the details (items and members) of a specific collection.
 * @returns {Promise<{items: Array, members: Array}>}
 */
export async function viewCollection(token, collectionId) {
  if (typeof token !== "string" || typeof collectionId !== "string") {
    throw new TypeError("Token and collection ID must be strings.");
  }

  try {
    const response = await api.post("/viewCollection", {
      token,
      collection: collectionId,
    });
    // Returns { items: [...], members: [...] }
    return response.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to view collection details."
    );
  }
}

/**
 * @route POST api/Collecting/addItem
 * @desc Add an item (e.g., Recipe ID) to a collection.
 */
export async function addItemToCollection(token, collectionId, itemId) {
  if (
    typeof token !== "string" ||
    typeof collectionId !== "string" ||
    typeof itemId !== "string"
  ) {
    throw new TypeError("Invalid inputs for adding item.");
  }

  try {
    await api.post("/addItem", {
      token,
      collection: collectionId,
      item: itemId,
    });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to add item to collection."
    );
  }
}

/**
 * @route POST api/Collecting/removeItem
 * @desc Remove an item from a collection.
 */
export async function removeItemFromCollection(token, collectionId, itemId) {
  if (
    typeof token !== "string" ||
    typeof collectionId !== "string" ||
    typeof itemId !== "string"
  ) {
    throw new TypeError("Invalid inputs for removing item.");
  }

  try {
    await api.post("/removeItem", {
      token,
      collection: collectionId,
      item: itemId,
    });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to remove item from collection."
    );
  }
}

/**
 * @route POST api/Collecting/addMember
 * @desc Add a user to a collection via their email address.
 */
export async function addMemberToCollection(token, collectionId, email) {
  if (
    typeof token !== "string" ||
    typeof collectionId !== "string" ||
    typeof email !== "string"
  ) {
    throw new TypeError("Invalid inputs for adding member.");
  }

  try {
    // Note: The sync looks up the user ID by email on the backend
    await api.post("/addMember", { token, collection: collectionId, email });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to add member.");
  }
}

/**
 * @route POST api/Collecting/removeMember
 * @desc Remove a user from the collection (Owner only).
 */
export async function removeMemberFromCollection(
  token,
  collectionId,
  targetUserId
) {
  if (
    typeof token !== "string" ||
    typeof collectionId !== "string" ||
    typeof targetUserId !== "string"
  ) {
    throw new TypeError("Invalid inputs for removing member.");
  }

  try {
    // Note: 'user' in the payload refers to the ID of the member being removed
    await api.post("/removeMember", {
      token,
      collection: collectionId,
      user: targetUserId,
    });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to remove member.");
  }
}

/**
 * @route POST api/Collecting/leave
 * @desc Voluntarily leave a collection.
 */
export async function leaveCollection(token, collectionId) {
  if (typeof token !== "string" || typeof collectionId !== "string") {
    throw new TypeError("Token and collection ID must be strings.");
  }

  try {
    await api.post("/leave", { token, collection: collectionId });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to leave collection.");
  }
}
