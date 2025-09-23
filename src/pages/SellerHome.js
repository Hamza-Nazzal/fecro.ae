/* See CODEGEN.md for architecture & conventions */
/*
1	Placeholder Seller dashboard.
	2	Describes planned features (discover RFQs, submit/manage quotes). No data yet.

*/
import SellerRFQsInline from "../components/SellerRFQsInline";


export default function SellerHome() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Seller Dashboard</h1>
      <p className="text-gray-600">Discover RFQs, submit quotations, and manage offers.</p>
      {/* TODO: render seller-facing list of available RFQs */}
    </div>
  );
}
