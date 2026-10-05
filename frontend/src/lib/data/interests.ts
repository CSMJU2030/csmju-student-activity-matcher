import { fetchJsonWithAuth, toQuery } from "@/lib/api/apiClient";
import { InterestCategory } from "@/types";

export interface InterestWithCategory {
  id: string;
  name: string;
  nameLower: string;
  icon: string;
  categoryId: string;
  isCustom: boolean;
  isActive: boolean;
  category: InterestCategory;
}

export interface InterestCategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface LookingForOptionData {
  id: string;
  label: string;
  icon: string;
}

async function listInterests(params: Parameters<typeof toQuery>[0] = {}): Promise<InterestWithCategory[]> {
  try {
    return await fetchJsonWithAuth(`/interests${toQuery(params)}`);
  } catch { return []; }
}

/** Active interests (admins can pass includeInactive to see disabled ones too). */
export async function getInterests(token: string = "", opts: { includeInactive?: boolean } = {}): Promise<InterestWithCategory[]> {
  return listInterests({ includeInactive: opts.includeInactive });
}

export async function getInterestsByIds(ids: string[], token: string = ""): Promise<InterestWithCategory[]> {
  if (ids.length === 0) return [];
  return listInterests({ ids });
}

export async function getCategories(token: string = ""): Promise<InterestCategoryData[]> {
  try {
    return await fetchJsonWithAuth(`/interests/categories`);
  } catch { return []; }
}

export async function getCategoryById(id: string, token: string = ""): Promise<InterestCategoryData | null> {
  try {
    return await fetchJsonWithAuth(`/interests/categories/${id}`);
  } catch { return null; }
}

export async function getInterestsByCategory(categoryId: string, token: string = ""): Promise<InterestWithCategory[]> {
  return listInterests({ categoryId });
}

export async function searchInterests(query: string, token: string = ""): Promise<InterestWithCategory[]> {
  return listInterests({ search: query.trim() });
}

export async function getLookingForOptions(token: string = ""): Promise<LookingForOptionData[]> {
  try {
    return await fetchJsonWithAuth(`/interests/looking-for-options`);
  } catch { return []; }
}

export interface CategoryWithCount extends InterestCategoryData {
  interestCount: number;
}

export interface LookingForWithCount extends LookingForOptionData {
  studentCount: number;
}

/** Admin only: categories with how many interests each holds. */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  try {
    return await fetchJsonWithAuth(`/interests/categories/admin`);
  } catch { return []; }
}

/** Admin only: looking-for options with how many students picked each. */
export async function getLookingForWithCounts(): Promise<LookingForWithCount[]> {
  try {
    return await fetchJsonWithAuth(`/interests/looking-for-options/admin`);
  } catch { return []; }
}
