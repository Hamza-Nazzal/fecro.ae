import { createRFQ, updateRFQ } from "../../services/rfqService";

export const makeSubmitRFQ = ({ getState, setSubmitting, setSubmitError, setRfqId, setSubmitted }) => async () => {
  const { submitting, orderDetails, items, rfqId } = getState();
  if (submitting) return;
  setSubmitError(null);
  setSubmitting(true);
  try {
    const titleVal =
      (orderDetails?.title && orderDetails.title.trim()) ||
      (items?.[0]?.productName || items?.[0]?.name) ||
      "RFQ";
    const rfqInput = { title: titleVal, orderDetails, items };
    const saved = rfqId ? await updateRFQ(rfqId, rfqInput) : await createRFQ(rfqInput);
    setRfqId(saved.id);
    setSubmitted(true);
  } catch (e) {
    console.error("Error submitting RFQ:", e);
    setSubmitError(e?.message || "Failed to submit RFQ");
  } finally {
    setSubmitting(false);
  }
};
