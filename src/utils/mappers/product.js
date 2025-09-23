// src/utils/mappers/product.js
export const PRODUCT_SCHEMA = {
  id: "id",
  sku: "sku",
  name: "name",
  description: "description",
  categoryId: "category_id",
  category: "category",
  subCategory: "sub_category",
  price: "price",
  currency: "currency",
  stock: "stock",
  status: "status",
  createdAt: "created_at",
  updatedAt: "updated_at",

  categoryPath: {
    toJs: (p) => p?.categories?.path_text || p?.category || p?.sub_category || "",
    toDb: null,
  },
  categoryDisplay: {
    toJs: (p) =>
      p?.categories?.path_text ??
      p?.categories?.name ??
      p?.sub_category ??
      p?.category ??
      null,
    toDb: null,
  },
};
