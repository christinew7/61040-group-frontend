// src/api/Recipe.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create an Axios instance for the Recipe concept
const api = axios.create({
  baseURL: `${API_BASE_URL}/Recipe`,
  headers: { "Content-Type": "application/json" },
});

/**
 * @route POST api/Recipe/createRecipe
 * @desc Create a new recipe.
 */
export async function createRecipe(
  token,
  title,
  link = null,
  description = null,
  image = null
) {
  if (typeof token !== "string") throw new TypeError("Token is required.");
  if (typeof title !== "string") throw new TypeError("Title is required.");

  try {
    const response = await api.post("/createRecipe", {
      token,
      title,
      link,
      description,
      image,
    });
    return response.data.recipe;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to create recipe.");
  }
}

/**
 * @route POST api/Recipe/deleteRecipe
 * @desc Delete a recipe and remove it from all collections.
 */
export async function deleteRecipe(token, recipeId) {
  if (typeof token !== "string" || typeof recipeId !== "string") {
    throw new TypeError("Token and recipe ID are required.");
  }

  try {
    await api.post("/deleteRecipe", { token, recipe: recipeId });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to delete recipe.");
  }
}

/**
 * @route POST api/Recipe/copyRecipe
 * @desc Create a copy of an existing recipe.
 */
export async function copyRecipe(token, originalRecipeId) {
  if (typeof token !== "string" || typeof originalRecipeId !== "string") {
    throw new TypeError("Token and original recipe ID are required.");
  }

  try {
    const response = await api.post("/copyRecipe", {
      token,
      recipe: originalRecipeId,
    });
    return response.data.recipe;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to copy recipe.");
  }
}

/**
 * @route POST api/Recipe/getAllMyRecipes
 * @desc Retrieve all recipes created by the current user.
 */
export async function getAllMyRecipes(token) {
  if (typeof token !== "string") throw new TypeError("Token is required.");

  try {
    const response = await api.post("/getAllMyRecipes", { token });
    return response.data.recipes;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to fetch recipes.");
  }
}

/**
 * @route POST api/Recipe/viewRecipe
 * @desc View a specific recipe by owner and title.
 */
export async function viewRecipe(token, ownerId, title) {
  if (
    typeof token !== "string" ||
    typeof ownerId !== "string" ||
    typeof title !== "string"
  ) {
    throw new TypeError("Token, ownerId, and title are required.");
  }

  try {
    const response = await api.post("/viewRecipe", {
      token,
      owner: ownerId,
      title,
    });
    // Returns { recipes, collectionsWithStatus } based on sync definition
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to view recipe.");
  }
}

/**
 * @route POST api/Recipe/getRecipe
 * @desc Get a specific recipe by ID.
 */
export async function getRecipe(token, recipeId) {
  if (typeof token !== "string" || typeof recipeId !== "string") {
    throw new TypeError("Token and recipe ID are required.");
  }

  try {
    const response = await api.post("/getRecipe", {
      token,
      recipe: recipeId,
    });
    return response.data.recipe;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to get recipe.");
  }
}

// --- Ingredient Management on Recipe ---

/**
 * @route POST api/Recipe/addIngredientToRecipe
 */
export async function addIngredientToRecipe(token, recipeId, ingredientId) {
  if (
    typeof token !== "string" ||
    typeof recipeId !== "string" ||
    typeof ingredientId !== "string"
  ) {
    throw new TypeError("Token, recipe ID, and ingredient ID are required.");
  }

  try {
    await api.post("/addIngredientToRecipe", {
      token,
      recipe: recipeId,
      ingredient: ingredientId,
    });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to add ingredient.");
  }
}

/**
 * @route POST api/Recipe/removeIngredientFromRecipe
 */
export async function removeIngredientFromRecipe(
  token,
  recipeId,
  ingredientId
) {
  if (
    typeof token !== "string" ||
    typeof recipeId !== "string" ||
    typeof ingredientId !== "string"
  ) {
    throw new TypeError("Token, recipe ID, and ingredient ID are required.");
  }

  try {
    await api.post("/removeIngredientFromRecipe", {
      token,
      recipe: recipeId,
      ingredient: ingredientId,
    });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to remove ingredient."
    );
  }
}

/**
 * @route POST api/Recipe/parseIngredients
 * @desc Parse raw text into structured ingredients and add them to the recipe.
 */
export async function parseIngredients(token, recipeId, ingredientsText) {
  if (
    typeof token !== "string" ||
    typeof recipeId !== "string" ||
    typeof ingredientsText !== "string"
  ) {
    throw new TypeError("Token, recipe ID, and text are required.");
  }

  try {
    const response = await api.post("/parseIngredients", {
      token,
      recipe: recipeId,
      ingredientsText,
    });
    return response.data.ingredients;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to parse ingredients."
    );
  }
}

// --- Recipe Metadata Updates ---

/**
 * @route POST api/Recipe/setLink
 */
export async function setLink(token, recipeId, link) {
  if (
    typeof token !== "string" ||
    typeof recipeId !== "string" ||
    typeof link !== "string"
  ) {
    throw new TypeError("Invalid inputs.");
  }
  try {
    await api.post("/setLink", { token, recipe: recipeId, link });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to set link.");
  }
}

/**
 * @route POST api/Recipe/removeLink
 */
export async function removeLink(token, recipeId) {
  try {
    await api.post("/removeLink", { token, recipe: recipeId });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to remove link.");
  }
}

/**
 * @route POST api/Recipe/setDescription
 */
export async function setDescription(token, recipeId, description) {
  if (typeof description !== "string")
    throw new TypeError("Description must be a string.");
  try {
    await api.post("/setDescription", { token, recipe: recipeId, description });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to set description.");
  }
}

/**
 * @route POST api/Recipe/removeDescription
 */
export async function removeDescription(token, recipeId) {
  try {
    await api.post("/removeDescription", { token, recipe: recipeId });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to remove description."
    );
  }
}

/**
 * @route POST api/Recipe/setImage
 */
export async function setImage(token, recipeId, image) {
  if (typeof image !== "string")
    throw new TypeError("Image must be a string url.");
  try {
    await api.post("/setImage", { token, recipe: recipeId, image });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to set image.");
  }
}

/**
 * @route POST api/Recipe/deleteImage
 */
export async function deleteImage(token, recipeId) {
  try {
    await api.post("/deleteImage", { token, recipe: recipeId });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to delete image.");
  }
}

// --- Global Ingredient CRUD ---

/**
 * @route POST api/Recipe/createIngredient
 */
export async function createIngredient(token, name, quantity, unit) {
  if (typeof token !== "string" || typeof name !== "string") {
    throw new TypeError("Token and name are required.");
  }

  try {
    const response = await api.post("/createIngredient", {
      token,
      name,
      quantity,
      unit,
    });
    return response.data.ingredient;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to create ingredient."
    );
  }
}

/**
 * @route POST api/Recipe/deleteIngredient
 */
export async function deleteIngredient(token, ingredientId) {
  try {
    await api.post("/deleteIngredient", { token, ingredient: ingredientId });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to delete ingredient."
    );
  }
}

/**
 * @route POST api/Recipe/editIngredient
 */
export async function editIngredient(
  token,
  inputIngredientId,
  newName,
  newQuantity,
  newUnit
) {
  try {
    await api.post("/editIngredient", {
      token,
      inputIngredient: inputIngredientId,
      newName,
      newQuantity,
      newUnit,
    });
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to edit ingredient.");
  }
}
