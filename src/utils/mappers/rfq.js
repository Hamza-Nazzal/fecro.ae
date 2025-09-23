// src/utils/mappers/rfq.js
import { emptyToNull, intOrNull, dateOrNull } from "./core.js";

export const RFQ_SCHEMA = {
  // passthroughs
  id: "id",
  userId: "user_id",
  publicId: "public_id",
  company: "company",
  postedTime: "posted_time",
  status: "status",
  quotations: "quotations",
  views: "views",
  createdAt: "created_at",

  // fields that may come from top-level OR orderDetails.*
  title: {
    dbField: "title",
    toJs: (r) => r?.title ?? null,
    toDb: (js) => emptyToNull(js?.title ?? js?.orderDetails?.title),
  },
  description: {
    dbField: "description",
    toJs: (r) => r?.description ?? null,
    toDb: (js) => emptyToNull(js?.description ?? js?.orderDetails?.description),
  },
  categoryId: {
    dbField: "category_id",
    toJs: (r) => r?.category_id ?? null,
    toDb: (js) => emptyToNull(js?.categoryId ?? js?.orderDetails?.categoryId),
  },
  category: {
    dbField: "category",
    toJs: (r) => r?.category ?? null,
    toDb: (js) => emptyToNull(js?.category ?? js?.orderDetails?.category),
  },
  subCategory: {
    dbField: "sub_category",
    toJs: (r) => r?.sub_category ?? null,
    toDb: (js) => emptyToNull(js?.subCategory ?? js?.orderDetails?.subCategory),
  },
  quantity: {
    dbField: "quantity",
    toJs: (r) => r?.quantity ?? null,
    toDb: (js) => intOrNull(js?.quantity ?? js?.orderDetails?.quantity),
  },
  orderType: {
    dbField: "order_type",
    toJs: (r) => r?.order_type ?? null,
    toDb: (js) => emptyToNull(js?.orderType ?? js?.order_type ?? js?.orderDetails?.orderType),
  },
  deliveryTime: {
    dbField: "delivery_time",
    toJs: (r) => r?.delivery_time ?? null,
    toDb: (js) =>
      emptyToNull(
        js?.deliveryTime ??
          js?.delivery_time ??
          js?.orderDetails?.deliveryTime ??
          js?.orderDetails?.deliveryTimeline
      ),
  },
  customDate: {
    dbField: "custom_date",
    toJs: (r) => r?.custom_date ?? null,
    toDb: (js) => dateOrNull(js?.customDate ?? js?.custom_date ?? js?.orderDetails?.customDate),
  },
  delivery: {
    dbField: "delivery",
    toJs: (r) => r?.delivery ?? null,
    toDb: (js) => emptyToNull(js?.delivery ?? js?.orderDetails?.delivery),
  },
  incoterms: {
    dbField: "incoterms",
    toJs: (r) => r?.incoterms ?? null,
    toDb: (js) => emptyToNull(js?.incoterms ?? js?.orderDetails?.incoterms),
  },
  payment: {
    dbField: "payment",
    toJs: (r) => r?.payment ?? null,
    toDb: (js) =>
      emptyToNull(js?.payment ?? js?.orderDetails?.payment ?? js?.orderDetails?.paymentTerms),
  },
  warranty: {
    dbField: "warranty",
    toJs: (r) => r?.warranty ?? null,
    toDb: (js) => emptyToNull(js?.warranty ?? js?.orderDetails?.warranty),
  },
  installation: {
    dbField: "installation",
    toJs: (r) => r?.installation ?? null,
    toDb: (js) => emptyToNull(js?.installation ?? js?.orderDetails?.installation),
  },

  // computed read-only
  categoryPath: {
    toJs: (r) => r?.categories?.path_text || r?.category || r?.sub_category || "",
    toDb: null,
  },
  categoryDisplay: {
    toJs: (r) =>
      r?.categories?.path_text ??
      r?.categories?.name ??
      r?.sub_category ??
      r?.category ??
      null,
    toDb: null,
  },

  // convenience aggregation for UI reads
  orderDetails: {
    toJs: (r) => ({
      quantity: r?.quantity ?? null,
      orderType: r?.order_type ?? null,
      deliveryTime: r?.delivery_time ?? null,
      customDate: r?.custom_date ?? null,
      delivery: r?.delivery ?? null,
      incoterms: r?.incoterms ?? null,
      payment: r?.payment ?? null,
      warranty: r?.warranty ?? null,
      installation: r?.installation ?? null,
    }),
    toDb: null,
  },
};
