//src/components/rfq-form/form/order.js

export const makeUpdateOrderDetails = ({ setOrderDetails }) => (patch) => {
  setOrderDetails((prev) => ({ ...prev, ...patch }));
};
