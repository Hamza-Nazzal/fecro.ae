export const makeUpdateOrderDetails = ({ setOrderDetails }) => (patch) => {
  setOrderDetails((prev) => ({ ...prev, ...patch }));
};
