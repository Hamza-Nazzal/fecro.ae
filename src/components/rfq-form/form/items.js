//src/components/rfq-form/form/items.js

import { uid, BLANK_ITEM } from './constants.js';
import { canSaveItem as _canSaveItem } from './validators.js';

const MAX_ITEMS = 50; // Maximum number of items allowed in an RFQ

export const makeAddOrUpdateItem = ({ getCurrentItem, setItems, setCurrentItem, setBasicsExpanded, setSpecsExpanded, didAutoExpandRef }) => () => {
  const currentItem = getCurrentItem();
  if (!_canSaveItem(currentItem)) return false;
  
  const qtyNum = Number(currentItem.quantity);
  const next = {
    ...currentItem,
    id: currentItem.id || uid(),
    quantity: Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 0,
    specCount: Object.values(currentItem.specifications || {}).filter(
      (spec) => (spec?.value ?? "").toString().trim().length > 0
    ).length,
  };
  
  setItems((prev) => {
    const i = prev.findIndex((it) => it.id === next.id);
    if (i >= 0) { 
      // Updating existing item - always allowed
      const clone = prev.slice(); 
      clone[i] = next; 
      return clone; 
    }
    // Adding new item - check limit
    if (prev.length >= MAX_ITEMS) {
      alert(`Maximum of ${MAX_ITEMS} items allowed per RFQ. Please remove an item before adding a new one.`);
      return prev;
    }
    return [...prev, next];
  });
  setCurrentItem(BLANK_ITEM);
  if (didAutoExpandRef) didAutoExpandRef.current = false;
  setBasicsExpanded(true);
  setSpecsExpanded(false);
  return true;
};

export const makeEditItem = ({ getItems, setCurrentItem, setBasicsExpanded, setSpecsExpanded, setCurrentStep, didAutoExpandRef }) => (id) => {
  const items = getItems();
  const it = items.find((x) => x.id === id);
  if (!it) return;
  setCurrentItem(it);
  if (didAutoExpandRef) didAutoExpandRef.current = false;
  setBasicsExpanded(true);
  setSpecsExpanded(false);
  setCurrentStep(1);
};

export const makeDuplicateItem = ({ getItems, setItems }) => (id) => {
  const items = getItems();
  const it = items.find((x) => x.id === id); if (!it) return;
  setItems((prev) => {
    if (prev.length >= MAX_ITEMS) {
      alert(`Maximum of ${MAX_ITEMS} items allowed per RFQ. Please remove an item before duplicating.`);
      return prev;
    }
    const copy = { ...it, id: uid(), productName: `${it.productName} (Copy)` };
    return [...prev, copy];
  });
};

export const makeRemoveItem = ({ setItems }) => (id) => {
  setItems((prev) => prev.filter((x) => x.id !== id));
};
