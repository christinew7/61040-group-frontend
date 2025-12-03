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
 * @returns {Promise<string>} The ID of the created recipe
 */
export async function createRecipe(
  token,
  title,
  link = null,
  description = null,
  isPublic = false
) {
  if (typeof token !== "string") throw new TypeError("Token is required.");
  if (typeof title !== "string") throw new TypeError("Title is required.");

  try {
    const response = await api.post("/createRecipe", {
      token,
      title,
      link,
      description,
      isPublic,
    });
    console.log("API response for createRecipe:", response.data);

    // Check if response contains an error
    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Backend returns { recipe: recipeId } where recipe is just the ID string
    const recipeId = response.data.recipe;
    console.log("Created recipe ID:", recipeId);
    return recipeId;
  } catch (err) {
    console.error("createRecipe API error:", err.response?.data || err.message);
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
    console.log("getAllMyRecipes response:", response.data);
    console.log("First recipe (if exists):", response.data.recipes?.[0]);
    return response.data.recipes;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to fetch recipes.");
  }
}

/**
 * @route POST api/Recipe/getAllRecipesGlobal
 * @desc Retrieve all recipes
 */
export async function getAllRecipesGlobal() {
  try {
    const response = await api.post("/_getAllRecipesGlobal");
    console.log("getAllRecipesGlobal response:", response);
    console.log("getAllRecipesGlobal response.data:", response.data);

    // Handle empty or invalid response
    if (!response.data) {
      console.log("No data in response, returning empty array");
      return [];
    }

    // Backend returns array of {recipe: {...}} objects
    // Extract the recipe from each object
    const recipes = Array.isArray(response.data)
      ? response.data.map((item) => item.recipe)
      : [];

    console.log("First recipe (if exists):", recipes[0]);
    console.log("Total recipes:", recipes.length);
    return recipes;
  } catch (err) {
    console.error("getAllRecipesGlobal error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to fetch recipes."
    );
  }
}

/**
 * @route POST api/Recipe/_search
 * @desc Search recipes by title
 * @param {string} query - The query to search for in recipe titles
 * @param {string} [userId] - Optional user ID to include their private recipes
 * @returns {Promise<Array>} Array of matching recipes
 */
export async function searchRecipes(query, userId = null) {
  if (typeof query !== "string") {
    throw new TypeError("Query is required.");
  }

  try {
    console.log("searchRecipes API called with query:", query);
    const payload = { query };
    if (userId) {
      payload.requestedBy = userId;
    }
    const response = await api.post("/_search", payload);
    console.log("searchRecipes response:", response.data);

    // Handle empty or invalid response
    if (!response.data) {
      console.log("No data in response, returning empty array");
      return [];
    }

    // Check if response contains an error
    // Backend returns [{ error: "..." }] or [{ recipes: [...] }]
    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        const errorMsg = response.data[0].error;
        console.error("Backend returned error:", errorMsg);
        throw new Error(errorMsg);
      }

      // Extract recipes from [{ recipes: [...] }]
      // Backend returns recipe IDs, so we need to fetch full recipes
      if (response.data[0].recipes) {
        const recipeIds = response.data[0].recipes;
        console.log("Search returned recipe IDs:", recipeIds);

        // Fetch all recipes and filter by IDs
        const allRecipesResponse = await api.post("/_getAllRecipesGlobal");
        const allRecipes = Array.isArray(allRecipesResponse.data)
          ? allRecipesResponse.data.map((item) => item.recipe)
          : [];

        // Filter to only include recipes with matching IDs
        const matchingRecipes = allRecipes.filter((recipe) =>
          recipeIds.includes(recipe._id)
        );

        console.log("Search results:", matchingRecipes.length, "recipes found");
        return matchingRecipes;
      }
    }

    console.log("Unexpected response format, returning empty array");
    return [];
  } catch (err) {
    console.error("searchRecipes error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to search recipes."
    );
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
 * @route POST api/Recipe/_getRecipe (passthrough - public)
 * @desc Get a recipe without authentication (no collection status)
 */
export async function getRecipe(owner, title) {
  if (typeof owner !== "string" || typeof title !== "string") {
    throw new TypeError("Owner and title are required.");
  }

  try {
    const response = await api.post("/_getRecipe", { owner, title });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return response.data; // Just the recipe
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

  console.log("parseIngredients called with:", {
    token: token.substring(0, 10) + "...",
    recipeId,
    ingredientsText,
  });

  try {
    const response = await api.post("/parseIngredients", {
      token,
      recipe: recipeId,
      ingredientsText,
    });
    console.log("parseIngredients response:", response.data);
    return response.data.ingredients;
  } catch (err) {
    console.error("parseIngredients error:", err.response?.data || err.message);
    throw new Error(
      err.response?.data?.error || "Failed to parse ingredients."
    );
  }
}

/**
 * @route POST api/Recipe/parseFromLink
 * @desc Parse a recipe from a URL using LLM and create a new recipe.
 * @param {string} token - Authentication token
 * @param {string} link - URL of the recipe to parse
 * @returns {Promise<Object>} The created recipe object
 */
export async function parseFromLink(token, link) {
  if (typeof token !== "string" || typeof link !== "string") {
    throw new TypeError("Token and link are required.");
  }

  console.log("parseFromLink called with:", {
    token: token.substring(0, 10) + "...",
    link,
  });

  try {
    const response = await api.post("/parseFromLink", {
      token,
      link,
    });
    console.log("parseFromLink response:", response.data);

    // Check if response contains an error
    if (response.data.error) {
      throw new Error(response.data.error);
    }

    // Backend returns { recipe: RecipeDoc }
    return response.data.recipe;
  } catch (err) {
    console.error("parseFromLink error:", err.response?.data || err.message);
    throw new Error(
      err.response?.data?.error ||
        err.message ||
        "Failed to parse recipe from link."
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

/**
 * @route POST api/Recipe/setRecipePublic
 */
export async function setRecipePublic(token, recipeId, isPublic) {
  if (typeof token !== "string" || typeof recipeId !== "string") {
    throw new TypeError("Token and recipe ID are required.");
  }
  if (typeof isPublic !== "boolean") {
    throw new TypeError("isPublic must be a boolean.");
  }

  try {
    await api.post("/setRecipePublic", { token, recipe: recipeId, isPublic });
    return true;
  } catch (err) {
    throw new Error(
      err.response?.data?.error || "Failed to set recipe visibility."
    );
  }
}

// /**
//  * @route POST api/Recipe/setRecipePublic
//  */
// export async function setRecipePublic(token, recipeId, isPublic) {
//     try {
//       await api.post("/setRecipePublic", { token, recipe: recipeId, isPublic });
//       return true;
//     } catch (err) {
//       throw new Error(err.response?.data?.error || "Failed to set public flag.");
//     }
// }

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

/**
 * @route POST api/Recipe/_search
 * @param {string} query
 * @param {string} [userId] - Optional user ID to include their private recipes
 * @returns {Promise<Array>} Array of RecipeDoc objects
 */
export async function search(query, userId = null) {
  try {
    if (!query || query.trim().length === 0) {
      // Avoid network call for empty query
      return [];
    }

    const payload = { query };
    if (userId) {
      payload.requestedBy = userId;
    }
    const response = await api.post("/_search", payload);
    const result = response.data;

    // Check for error object inside array
    if (result.length > 0 && result[0].error) {
      throw new Error(result[0].error);
    }

    // Now returns: [{_id:..., title: "Soup", ...}, {...}]
    return result[0]?.recipes || [];
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message);
  }
}

/**
 * @route POST api/Recipe/_findRecipeByIngredient
 * @desc Find recipes that contain the specified ingredients, sorted by match count
 * @param {string[]} ingredients - Array of ingredient names to search for
 * @param {string} [userId] - Optional user ID to include their private recipes
 * @returns {Promise<Array>} Array of matching RecipeDoc objects
 */
export async function findRecipeByIngredient(ingredients, userId = null) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new TypeError("Ingredients must be a non-empty array.");
  }

  try {
    console.log("findRecipeByIngredient called with:", ingredients);
    const payload = { ingredients };
    if (userId) {
      payload.requestedBy = userId;
    }
    const response = await api.post("/_findRecipeByIngredient", payload);
    console.log("findRecipeByIngredient response:", response.data);

    // Handle empty or invalid response
    if (!response.data) {
      return [];
    }

    // Backend returns [{ recipes: [...] }] or [{ error: "..." }]
    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].recipes || [];
    }

    return [];
  } catch (err) {
    console.error("findRecipeByIngredient error:", err);
    throw new Error(
      err.response?.data?.error ||
        err.message ||
        "Failed to find recipes by ingredient."
    );
  }
}

/**
 * @route POST api/Recipe/_filterIngredientAndSearch
 * @desc Search recipes by title AND filter by ingredients
 * @param {string} query - Search query for recipe title
 * @param {string[]} ingredients - Array of ingredient names to filter by
 * @param {string} [userId] - Optional user ID to include their private recipes
 * @returns {Promise<Array>} Array of matching RecipeDoc objects
 */
export async function filterIngredientAndSearch(query, ingredients, userId = null) {
  if (typeof query !== "string" || query.trim().length === 0) {
    throw new TypeError("Query is required.");
  }
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new TypeError("Ingredients must be a non-empty array.");
  }

  try {
    console.log("filterIngredientAndSearch called with:", {
      query,
      ingredients,
    });
    const payload = { query, ingredients };
    if (userId) {
      payload.requestedBy = userId;
    }
    const response = await api.post("/_filterIngredientAndSearch", payload);
    console.log("filterIngredientAndSearch response:", response.data);

    // Handle empty or invalid response
    if (!response.data) {
      return [];
    }

    // Backend returns [{ recipes: [...] }] or [{ error: "..." }]
    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].recipes || [];
    }

    return [];
  } catch (err) {
    console.error("filterIngredientAndSearch error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to filter recipes."
    );
  }
}

/**
 * @route POST api/Recipe/_findRecipeByIngredientWithinRecipes
 * @desc Find recipes within a specific set that contain the specified ingredients
 * @param {string[]} ingredients - Array of ingredient names to search for
 * @param {string[]} recipes - Array of recipe IDs to search within
 * @returns {Promise<Array>} Array of matching recipe IDs
 */
export async function findRecipeByIngredientWithinRecipes(
  ingredients,
  recipes
) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new TypeError("Ingredients must be a non-empty array.");
  }
  if (!Array.isArray(recipes) || recipes.length === 0) {
    return [];
  }

  try {
    console.log("findRecipeByIngredientWithinRecipes called with:", {
      ingredients,
      recipes,
    });
    const response = await api.post("/_findRecipeByIngredientWithinRecipes", {
      ingredients,
      recipes,
    });
    console.log("findRecipeByIngredientWithinRecipes response:", response.data);

    if (!response.data) {
      return [];
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].recipes || [];
    }

    return [];
  } catch (err) {
    console.error("findRecipeByIngredientWithinRecipes error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to find recipes."
    );
  }
}

/**
 * @route POST api/Recipe/_searchWithinRecipes
 * @desc Search recipes by title within a specific set of recipes
 * @param {string} query - Search query for recipe title
 * @param {string[]} recipes - Array of recipe IDs to search within
 * @returns {Promise<Array>} Array of matching recipe IDs
 */
export async function searchWithinRecipes(query, recipes) {
  if (typeof query !== "string" || query.trim().length === 0) {
    throw new TypeError("Query is required.");
  }
  if (!Array.isArray(recipes) || recipes.length === 0) {
    return [];
  }

  try {
    console.log("searchWithinRecipes called with:", { query, recipes });
    const response = await api.post("/_searchWithinRecipes", {
      query,
      recipes,
    });
    console.log("searchWithinRecipes response:", response.data);

    if (!response.data) {
      return [];
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].recipes || [];
    }

    return [];
  } catch (err) {
    console.error("searchWithinRecipes error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to search recipes."
    );
  }
}

/**
 * @route POST api/Recipe/_filterIngredientAndSearchWithinRecipes
 * @desc Search recipes by title AND filter by ingredients within a specific set
 * @param {string[]} recipes - Array of recipe IDs to search within
 * @param {string} query - Search query for recipe title
 * @param {string[]} ingredients - Array of ingredient names to filter by
 * @returns {Promise<Array>} Array of matching recipe IDs
 */
export async function filterIngredientAndSearchWithinRecipes(
  recipes,
  query,
  ingredients
) {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    return [];
  }
  if (typeof query !== "string" || query.trim().length === 0) {
    throw new TypeError("Query is required.");
  }
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new TypeError("Ingredients must be a non-empty array.");
  }

  try {
    console.log("filterIngredientAndSearchWithinRecipes called with:", {
      recipes,
      query,
      ingredients,
    });
    const response = await api.post(
      "/_filterIngredientAndSearchWithinRecipes",
      {
        recipes,
        query,
        ingredients,
      }
    );
    console.log(
      "filterIngredientAndSearchWithinRecipes response:",
      response.data
    );

    if (!response.data) {
      return [];
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].recipes || [];
    }

    return [];
  } catch (err) {
    console.error("filterIngredientAndSearchWithinRecipes error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to filter recipes."
    );
  }
}

/**
 * @route POST api/Recipe/_getIngredients
 * @desc Get all ingredients
 * @returns {Promise<Array>} Array of all ingredient objects
 */
export async function getIngredients() {
  try {
    const response = await api.post("/_getIngredients", {});
    console.log("getIngredients response:", response.data);

    if (!response.data) {
      return [];
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].ingredients || [];
    }

    return [];
  } catch (err) {
    console.error("getIngredients error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to fetch ingredients."
    );
  }
}

/**
 * @route POST api/Recipe/_getIngredientsByName
 * @desc Search for ingredients by name
 * @param {string} name - Ingredient name to search for
 * @returns {Promise<Array>} Array of matching ingredient objects
 */
export async function getIngredientsByName(name) {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new TypeError("Ingredient name is required.");
  }

  try {
    console.log("getIngredientsByName called with:", name);
    const response = await api.post("/_getIngredientsByName", { name });
    console.log("getIngredientsByName response:", response.data);

    if (!response.data) {
      return [];
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].ingredients || [];
    }

    return [];
  } catch (err) {
    console.error("getIngredientsByName error:", err);
    throw new Error(
      err.response?.data?.error ||
        err.message ||
        "Failed to search ingredients."
    );
  }
}

/**
 * @route POST api/Recipe/_scaleIngredients
 * @desc Scale recipe ingredients by a factor
 * @param {string} recipe - Recipe ID
 * @param {number} scaleFactor - Factor to scale by (must be positive)
 * @returns {Promise<Array>} Array of scaled ingredient objects
 */
export async function scaleIngredients(recipe, scaleFactor) {
  if (typeof recipe !== "string") {
    throw new TypeError("Recipe ID is required.");
  }
  if (typeof scaleFactor !== "number" || scaleFactor <= 0) {
    throw new TypeError("Scale factor must be a positive number.");
  }

  try {
    console.log("scaleIngredients called with:", { recipe, scaleFactor });
    const response = await api.post("/_scaleIngredients", {
      recipe,
      scaleFactor,
    });
    console.log("scaleIngredients response:", response.data);

    if (!response.data) {
      return [];
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      if (response.data[0].error) {
        throw new Error(response.data[0].error);
      }
      return response.data[0].ingredients || [];
    }

    return [];
  } catch (err) {
    console.error("scaleIngredients error:", err);
    throw new Error(
      err.response?.data?.error || err.message || "Failed to scale ingredients."
    );
  }
}
