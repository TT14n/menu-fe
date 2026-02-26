import axios from 'axios';
import type { Item, Recipe } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 获取所有食材
export async function getInventory(): Promise<Item[]> {
  const response = await api.get<Item[]>('/inventory');
  return response.data;
}

// 添加食材
export async function addInventoryItem(item: Omit<Item, 'id'>): Promise<Item> {
  const response = await api.post<Item>('/inventory', item);
  return response.data;
}

// 批量添加食材
export async function addInventoryItems(items: Omit<Item, 'id'>[]): Promise<Item[]> {
  const response = await api.post<Item[]>('/inventory/batch', items);
  return response.data;
}

// 获取所有菜谱
export async function getRecipes(): Promise<Recipe[]> {
  const response = await api.get<Recipe[]>('/recipes');
  return response.data;
}

// Mock 数据（用于开发测试）
export const mockItems: Item[] = [
  {
    id: '1',
    name: '西红柿',
    productionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    shelfLife: 7,
    type: 'vegetable',
    storageType: 'refrigerated',
  },
  {
    id: '2',
    name: '鸡蛋',
    productionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    shelfLife: 30,
    type: 'carbs',
    storageType: 'refrigerated',
  },
  {
    id: '3',
    name: '猪肉',
    productionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shelfLife: 3,
    type: 'meat',
    storageType: 'frozen',
  },
  {
    id: '4',
    name: '苹果',
    productionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    shelfLife: 14,
    type: 'fruit',
    storageType: 'room-temp',
  },
  {
    id: '5',
    name: '青菜',
    productionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    shelfLife: 7,
    type: 'vegetable',
    storageType: 'refrigerated',
  },
];

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: '西红柿炒鸡蛋',
    type: 'quick',
    ingredients: ['西红柿', '鸡蛋'],
    seasonings: ['盐', '糖', '葱'],
  },
  {
    id: '2',
    name: '红烧肉',
    type: 'slow',
    ingredients: ['猪肉', '土豆', '胡萝卜'],
    seasonings: ['酱油', '料酒', '八角', '姜', '蒜'],
  },
  {
    id: '3',
    name: '清炒青菜',
    type: 'quick',
    ingredients: ['青菜'],
    seasonings: ['盐', '蒜', '油'],
  },
  {
    id: '4',
    name: '糖醋排骨',
    type: 'slow',
    ingredients: ['排骨', '青椒', '洋葱'],
    seasonings: ['糖', '醋', '酱油', '料酒', '姜'],
  },
];

