import { uid, BLANK_ITEM } from './constants.js';
import { canSaveItem as _canSaveItem } from './validators.js';

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
    if (i >= 0) { const clone = prev.slice(); clone[i] = next; return clone; }
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
  const copy = { ...it, id: uid(), productName: `${it.productName} (Copy)` };
  setItems((prev) => [...prev, copy]);
};

export const makeRemoveItem = ({ setItems }) => (id) => {
  setItems((prev) => prev.filter((x) => x.id !== id));
};
