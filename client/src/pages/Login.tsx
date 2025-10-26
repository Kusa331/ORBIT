import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Check, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
// import { loginToUic } from "@/lib/uicApi";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Login() {
  useRoute<{ subsystem?: string }>("/login/:subsystem?");

  const { isAuthenticated, user } = useAuth();

  // Remove username, use email only
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [domainBlockMsg, setDomainBlockMsg] = useState("");
  const [showDomainBlockModal, setShowDomainBlockModal] = useState(false);
  // Keep a ref for the initial domain-block detection so we can prevent
  // automatic redirects even after the query string is cleaned.
  const domainBlockedRef = useRef(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);


  // When the confirm modal opens, focus the Confirm button so Enter will activate it immediately


  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
      // domain block can come via query (?domain_block=1), via an error param (?error=domain_restricted),
      // or via the OAuth fragment (#error=domain_restricted) depending on provider behavior.
      // Also respect a sessionStorage flag set by other parts of the app.
      const fromSearch = Boolean(params.get('domain_block')) || params.get('error') === 'domain_restricted';
      const fromHash = Boolean(hashParams.get('domain_block')) || hashParams.get('error') === 'domain_restricted';
      const fromSession = (() => { try { return !!sessionStorage.getItem('orbit:domain_blocked'); } catch (_) { return false; } })();
      const domainBlocked = fromSearch || fromHash || fromSession;
      if (domainBlocked) {
        setDomainBlockMsg('Access restricted: Please use your UIC email account (@uic.edu.ph) to sign in.');
        setShowDomainBlockModal(true);
        domainBlockedRef.current = true;
        // Remember that we've shown the domain-block flow so other parts of
        // the app (which may still be trying to sync) don't repeatedly
        // redirect back to the login page.
        try { sessionStorage.setItem('orbit:domain_blocked', '1'); } catch (_) {}
        // Clean query string and fragment so message isn't persistent on refresh
        try { window.history.replaceState({}, '', window.location.pathname); } catch (_) {}
        try { if (window.location.hash) window.history.replaceState({}, '', window.location.pathname); } catch (_) {}
        // When the UI explicitly indicates the domain is blocked, do not auto-redirect
        // even if the user is authenticated. Return early and let the user dismiss
        // the modal or take action.
        return;
      }
    } catch (e) {}
    // If we previously detected a domain block, do not redirect even if the
    // user becomes authenticated (we want the user to explicitly dismiss the modal).
    if (domainBlockedRef.current) return;

    // Redirect authenticated users to the appropriate dashboard.
    if (isAuthenticated && user) {
      try {
        if (user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/booking";
        }
      } catch (e) {
        // If anything goes wrong, do not redirect and let the user proceed manually.
        console.error("Redirect after login failed:", e);
      }
    }
  }, [isAuthenticated, user]);

  const signInWithGoogle = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Redirect back to the login page so the client can detect domain
          // restrictions and show an appropriate UI instead of landing at
          // the app root where the user may appear briefly signed in.
          redirectTo: `${window.location.origin}/login`,
          // Force Google to show the account chooser so users can pick which account to use
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) setErrorMsg("Sign-in failed: " + error.message);
    } catch (e) {
      setErrorMsg("Sign-in failed");
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    setLoading(true);
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Login failed: missing email or password");
      setLoading(false);
      return;
    }
    try {
      // Use Supabase email/password login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMsg("Login failed: " + error.message);
      }
      // On success, useAuth will pick up the session and redirect
    } catch (e: any) {
      setErrorMsg("Login failed: " + (e?.message || "Unknown error"));
    }
    setLoading(false);
  };

  // subsystem prop is available if needed later

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/facility-overview.jpg)' }} />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative w-full max-w-md z-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-1">
                <img
                  src="/orbit-logo.png"
                  alt="ORBIT Logo"
                  className="h-24 sm:h-28 w-auto object-contain"
                />
              </div>
              <div className="text-center mb-3">
                <p className="text-sm text-gray-700 font-bold">Integrated Library Facility Management System</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-pink-600 font-medium text-sm py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                disabled={loading}
              >
                <Mail className="h-5 w-5 text-pink-600" />
                {loading ? "Signing in..." : "Sign in with University Email"}
              </button>

              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-gray-200" />
                <span className="mx-3 text-xs text-gray-400">Or continue with</span>
                <div className="flex-grow border-t border-gray-200" />
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center shadow-sm">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-pink-600 focus:outline-none transition-all duration-200 shadow-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-pink-600 focus:outline-none transition-all duration-200 shadow-sm"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  By continuing, you agree to our{" "}
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-pink-600 hover:text-pink-700 underline transition-colors text-xs"
                  >
                    Terms and Conditions
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button onClick={() => window.location.href = "/"} className="absolute top-6 left-6 z-20 text-gray-700 hover:text-gray-900 text-sm font-medium bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
        ← Back to Home
      </button>
      
      {/* Terms and Conditions Modal */}
    <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center mb-4">
              ORBIT - Integrated Library Facility Management System — Terms and Conditions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-700">
            <p className="font-semibold">Introduction</p>
            <p>
              ORBIT is provided to authorized members of the University of the Immaculate Conception ("UIC") to request and manage facility reservations and related services. These Terms explain acceptable use, what data we collect and why, and how we handle violations. By using ORBIT you agree to follow these Terms and any applicable university policies.
            </p>

            <h4 className="font-semibold">Eligibility</h4>
            <p>Access is granted only to current UIC students, faculty, and staff with valid institutional accounts. Sharing credentials or accessing another person’s account is strictly prohibited.</p>

            <h4 className="font-semibold">Acceptable Use</h4>
            <p>Use ORBIT only for legitimate academic, research, or university-related activities. Do not make fraudulent or overlapping bookings, attempt to bypass booking limits, or use the system to disrupt other users' access.</p>

            <h4 className="font-semibold">Data & Privacy</h4>
            <p>
              We collect basic profile details (name, institutional email, profile photo) and booking metadata (times, facility, participants) to operate the service. Collected data is used for reservation management, notifications, and administrative reporting and is handled in accordance with UIC's privacy policies.
            </p>

            <h4 className="font-semibold">Bookings, Cancellations & No-shows</h4>
            <p>
              Please create reservations in good faith and cancel promptly if plans change. Repeated no-shows or last-minute cancellations may result in temporary restrictions. Follow any facility-specific rules listed in the facility details when using a space.
            </p>

            <h4 className="font-semibold">Enforcement & Appeals</h4>
            <p>
              Violations may result in warnings, temporary suspension, or permanent loss of access. Serious cases may be referred to university authorities. If you believe an action was taken in error, contact the library or the system administrators to request a review.
            </p>

            <h4 className="font-semibold">Contact & Support</h4>
            <p>
              For questions, support, or to report problems with a facility, contact the library staff using the contact information provided in the facility details or the university directory.
            </p>

            <p className="text-sm text-gray-600">Click "I Understand" to acknowledge these Terms and continue. Your acknowledgement will be recorded for compliance and support purposes.</p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="ghost"
              onClick={() => setShowTermsModal(false)}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setShowTermsModal(false)}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Create Account Modal (UIC Account Required) */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center mb-2">UIC Account Required</DialogTitle>
          </DialogHeader>

          <div className="p-4">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white rounded-full p-4 shadow-sm border border-pink-100">
                  <Mail className="h-8 w-8 text-pink-600" />
                </div>
              </div>
              <h4 className="font-semibold text-lg text-gray-900 mb-2">University Account Only</h4>
              <p className="text-sm text-gray-600 mb-4">ORBIT requires a valid UIC (University of the Immaculate Conception) email account to access school services.</p>
              <p className="text-sm text-gray-600 mb-6">You can sign in using your UIC Account (Google OAuth).</p>

              <div className="space-y-3">
                <Button
                  onClick={() => { setShowCreateModal(false); signInWithGoogle(); }}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 rounded-lg"
                >
                  Sign in with UIC Account
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">If you don't have a UIC account, please contact the school administration for assistance.</p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Domain Block Modal */}
      <Dialog open={showDomainBlockModal} onOpenChange={setShowDomainBlockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center mb-2 text-red-600">Access Restricted</DialogTitle>
          </DialogHeader>

          <div className="p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white rounded-full p-4 shadow-sm border border-yellow-100">
                  <Mail className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <h4 className="font-semibold text-lg text-gray-900 mb-2">UIC Email Required</h4>
              <p className="text-sm text-gray-700 mb-4">{domainBlockMsg}</p>
              <p className="text-sm text-gray-600">Please sign in using your @uic.edu.ph email account to access ORBIT.</p>
            </div>
          </div>

          <div className="flex justify-center pb-4">
            <Button
              onClick={() => setShowDomainBlockModal(false)}
              className="bg-pink-600 hover:bg-pink-700 text-white px-8"
            >
              OK, I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}