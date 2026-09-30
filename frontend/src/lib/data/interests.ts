"use server";
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

export async function getInterests(token: string = ""): Promise<InterestWithCategory[]> {
  try {
    const res = await fetch(`${BASE_URL}/interests`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export async function getInterestsByIds(ids: string[], token: string = ""): Promise<InterestWithCategory[]> {
  return [];
}

export async function getCategories(token: string = ""): Promise<InterestCategoryData[]> {
  try {
    const res = await fetch(`${BASE_URL}/interests/categories`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export async function getCategoryById(id: string, token: string = ""): Promise<InterestCategoryData | null> {
  return null;
}

export async function getInterestsByCategory(categoryId: string, token: string = ""): Promise<InterestWithCategory[]> {
  return [];
}

export async function searchInterests(query: string, token: string = ""): Promise<InterestWithCategory[]> {
  return [];
}

export async function getLookingForOptions(token: string = ""): Promise<LookingForOptionData[]> {
  return [];
}

export async function getInterestByNameLower(nameLower: string, token: string = ""): Promise<InterestWithCategory | null> {
  return null;
}
