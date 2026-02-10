import { request } from './http';

function expectArrayResponse(res, label) {
  if (!res.ok) {
    throw new Error(res.data?.detail || `Błąd API (${label})`);
  }

  if (!Array.isArray(res.data)) {
    throw new Error(`Nieprawidłowa odpowiedź API (${label})`);
  }

  return res.data;
}

export async function getProteins() {
  const res = await request('/meals/proteins/all');
  return expectArrayResponse(res, 'proteins');
}

export async function createProtein(payload) {
  const res = await request('/meals/proteins/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się dodać proteinu');
  }
}

export async function updateProtein(id, payload) {
  const res = await request(`/meals/proteins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się zaktualizować proteinu');
  }
}

export async function deleteProtein(id) {
  const res = await request(`/meals/proteins/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się usunąć proteinu');
  }
}

export async function getBases() {
  const res = await request('/meals/bases/all');
  return expectArrayResponse(res, 'bases');
}

export async function createBase(payload) {
  const res = await request('/meals/bases/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się dodać bazy');
  }
}

export async function updateBase(id, payload) {
  const res = await request(`/meals/bases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się zaktualizować bazy');
  }
}

export async function deleteBase(id) {
  const res = await request(`/meals/bases/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się usunąć bazy');
  }
}

export async function getMeals() {
  const res = await request('/meals/');
  if (!res.ok || !Array.isArray(res.data)) {
    throw new Error('Nie udało się pobrać dań');
  }
  return res.data;
}

export async function getMeal(id) {
  const res = await request(`/meals/${id}`);
  if (!res.ok) {
    throw new Error('Nie udało się pobrać dania');
  }
  return res.data;
}

export async function createMeal(payload) {
  const res = await request('/meals/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się dodać dania');
  }

  return res.data;
}

export async function updateMeal(id, payload) {
  const res = await request(`/meals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się zaktualizować dania');
  }
}

export async function deleteMeal(id) {
  const res = await request(`/meals/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się usunąć dania');
  }
}

export async function getSimpleMeals() {
  const res = await request('/meals/simple-list');
  if (!res.ok || !Array.isArray(res.data)) {
    throw new Error('Nie udało się pobrać listy dań');
  }
  return res.data;
}

export async function getMonthPlan(year, month) {
  const res = await request(`/planning/month/${year}/${month}`);
  if (!res.ok) {
    throw new Error('Nie udało się pobrać planu miesiąca');
  }
  return res.data;
}

export async function addMealToPlan(payload) {
  const res = await request('/planning/add-meal', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się dodać posiłku do planu');
  }
  return res.data;
}

export async function deleteDayPlan(date) {
  const res = await request(`/planning/day/${date}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się usunąć planu z tego dnia');
  }
}

export async function deleteWeekPlan(mondayDate) {
  const res = await request(`/planning/week/${mondayDate}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(res.data?.detail || 'Nie udało się usunąć planu z całego tygodnia');
  }
}

export async function generateWeeklyProposal(mondayDate) {
  const res = await request(`/planning/generate-proposal/${mondayDate}`);
  if (!res.ok) throw new Error(res.data?.detail || 'Nie udało się wygenerować propozycji');
  return res.data;
}

export async function acceptProposal(proposal) {
  const res = await request('/planning/accept-proposal', {
    method: 'POST',
    body: JSON.stringify(proposal),
  });
  if (!res.ok) throw new Error(res.data?.detail || 'Nie udało się zapisać planu');
  return res.data;
}

export async function getMealSettings() {
  const res = await request('/settings/meals/');
  if (!res.ok) throw new Error('Nie udało się pobrać ustawień');
  return res.data;
}

export async function updateMealSettings(payload) {
  const res = await request('/settings/meals/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Nie udało się zaktualizować ustawień');
  return res.data;
}

export async function setupDefaultMeals() {
  const res = await request('/settings/meals/setup-defaults', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Nie udało się wygenerować domyślnych danych');
  return res.data;
}

export async function mealGetIngredients() {
  const res = await request('/meals/ingredients/');
  if (!res.ok || !Array.isArray(res.data)) throw new Error('Nie udało się pobrać składników');
  return res.data;
}

export async function mealCreateIngredient(payload) {
  const res = await request('/meals/ingredients/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.detail || 'Błąd podczas tworzenia składnika');
  return res.data;
}

export async function mealGetRecipe(id_meal) {
  const res = await request(`/meals/ingredients/${id_meal}`);
  if (!res.ok) throw new Error('Nie udało się pobrać receptury');
  return res.data;
}

export async function mealAddIngredientToMeal(id_meal, payload) {
  const res = await request(`/meals/ingredients/${id_meal}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.detail || 'Błąd podczas dodawania do receptury');
  return res.data;
}

export async function mealDeleteRecipeItem(id_recipe) {
  const res = await request(`/meals/ingredients/recipe/${id_recipe}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Nie udało się usunąć składnika z receptury');
}

export async function mealUpdateRecipeItem(id_recipe, payload) {
  const res = await request(`/meals/ingredients/recipe/${id_recipe}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.data?.detail || 'Błąd podczas aktualizacji składnika');
  return res.data;
}

export async function getShoppingList(startDate) {
  const res = await request(`/analysis/shopping-list?start_date=${startDate}`);
  if (!res.ok) throw new Error(res.data?.detail || 'Błąd pobierania listy zakupów');
  return res.data;
}