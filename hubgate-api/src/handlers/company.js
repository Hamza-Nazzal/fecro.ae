// hubgate-api/src/handlers/company.js

import { ok, jsonResponse } from "../utils/response.js";
import { corsHeaders } from "../utils/cors.js";
import { requireUser } from "../lib/auth.js";
import { supaPOSTService, supaGETService, supaPATCHService } from "../lib/supabase.js";


export async function createCompany(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  const payload = await req.json().catch(() => ({}));
  const name = (payload?.name || "").trim();

  if (!name) {
    return jsonResponse({ error: "name_required" }, 400, acao);
  }

  // Extract optional fields and map to database columns
  const legalName = (payload?.legalName || "").trim() || null;
  const tradeLicenseNo = (payload?.tradeLicenseNo || "").trim() || null;
  const country = (payload?.country || "").trim() || null;
  const city = payload?.city || null;
  const phone = (payload?.phone || "").trim() || null;

  try {
    const companyData = {
      name,
      legal_name: legalName,
      trade_license_no: tradeLicenseNo,
      country,
      city,
      phone,
      created_by_user_id: user.id,
    };

    // Remove null values to let database use defaults
    Object.keys(companyData).forEach(
      (key) => companyData[key] === null && delete companyData[key]
    );

    const [company] = await supaPOSTService(env, "companies", companyData);
    
    // Keep the existing logic that inserts a row into company_memberships for the creator
    const [m] = await supaPOSTService(env, "company_memberships", {
      company_id: company.id,
      user_id: user.id,
      track: "procurement",
      role_level: 10,
    });

    return ok(
      { companyId: company.id, name: company.name ?? name, membershipId: m.id },
      corsHeaders(acao)
    );
  } catch (e) {
    console.error("company/create crash:", e?.stack || e?.message || e);
    return jsonResponse({ error: "worker_crash", message: String(e) }, 500, acao);
  }
}

export async function inviteCompanyUser(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  const { email } = await req.json().catch(() => ({}));

  if (!email) return jsonResponse({ error: "missing_email" }, 400, acao);
  const token = crypto.randomUUID();
  try {

    const result = await supaPOSTService(env, "company_invites", {
      company_id: user.company_id,
      email,
      invited_by: user.id,
      token,
    });

    const invite = Array.isArray(result) ? result[0] : result;
    return jsonResponse({ ok: true, invite }, 200, acao);

  } catch (err) {
    return jsonResponse(
      { error: "invite_create_failed", details: err.message || String(err) },
      500,
      acao
    );
  }
}

export async function acceptCompanyInvite(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body.token || "").trim();
    if (!token) return jsonResponse({ error: "missing_token" }, 400, acao);
    // 1) pending invite by token

    const { data: invites, error: fetchErr } = await supaGETService(
      env, `company_invites?token=eq.${encodeURIComponent(token)}&status=eq.pending`
    );
    if (fetchErr) throw new Error(fetchErr.message);
    const invite = (invites || [])[0];
    if (!invite) return jsonResponse({ error: "invalid_or_expired" }, 404, acao);
    // Email match validation

    if (invite.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return jsonResponse({ error: "invite_email_mismatch" }, 403, acao);
    }
    // 2) Create company membership

    let membershipId;
    try {
      const [membership] = await supaPOSTService(env, "company_memberships", {
        company_id: invite.company_id,
        user_id: user.id,
        track: "sales",
        role_level: 10,
      });
      membershipId = membership.id;
    } catch (e) {
      const msg = String(e.message || e);
      const isDuplicate = msg.includes('"code":"23505"') || msg.includes("company_memberships_company_id_user_id_key");
      if (!isDuplicate) throw e;
      // already a member → look it up
      const { data: existing } = await supaGETService(
        env,
        `company_memberships?company_id=eq.${encodeURIComponent(invite.company_id)}&user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`
      );
      membershipId = existing?.[0]?.id || null;
    }
    // 3) Mark invite as accepted (even if duplicate)

    await supaPATCHService(env, "company_invites", invite.id, {
      status: "accepted",
      accepted_at: new Date().toISOString(),
    });
    return jsonResponse(

      { ok: true, company_id: invite.company_id, membership_id: membershipId },
      200,
      acao
    );
  } catch (err) {
    return jsonResponse({ error: "worker_crash", message: String(err) }, 500, acao);
  }
}

// Get current user info with company_id
export async function getMe(req, env, acao) {
  const authCheck = await requireUser(req, env, acao);
  if (!authCheck.ok) return authCheck.res;
  const user = authCheck.user;
  
  // requireUser already attaches company_id to user object
  return jsonResponse(
    {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
      company_id: user.company_id || null,
    },
    200,
    acao
  );
}

// Public endpoint to get invite details by token (minimal info only)
export async function getCompanyInvite(req, env, acao) {
  try {
    const url = new URL(req.url);
    const token = url.pathname.split("/").pop(); // Extract token from /company/invite/:token
    
    if (!token || token === "invite") {
      return jsonResponse({ error: "missing_token" }, 400, acao);
    }

    // Fetch invite using service key (public endpoint, no auth required)
    const { data: invites, error: fetchErr } = await supaGETService(
      env,
      `company_invites?token=eq.${encodeURIComponent(token)}&select=email,company_id,status`
    );
    
    if (fetchErr) throw new Error(fetchErr.message);
    const invite = Array.isArray(invites) && invites.length > 0 ? invites[0] : null;
    
    if (!invite) {
      return jsonResponse({ error: "invalid_or_expired" }, 404, acao);
    }

    // Fetch company name
    let companyName = null;
    if (invite.company_id) {
      const { data: companies, error: companyErr } = await supaGETService(
        env,
        `companies?id=eq.${encodeURIComponent(invite.company_id)}&select=name&limit=1`
      );
      if (!companyErr && Array.isArray(companies) && companies.length > 0) {
        companyName = companies[0].name;
      }
    }

    // Return minimal info only
    return jsonResponse(
      {
        email: invite.email,
        companyName,
        status: invite.status,
      },
      200,
      acao
    );
  } catch (err) {
    return jsonResponse({ error: "worker_crash", message: String(err) }, 500, acao);
  }
}
