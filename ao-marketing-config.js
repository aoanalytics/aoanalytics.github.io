/* Public marketing config — no secrets. Override dashboard host via Pages if needed. */
window.AO_MARKETING = {
  dashboardUrl: "https://52.206.45.177",
  loginPath: "/login",
  marketingUrl: "https://aoanalytics.github.io",
  alphaCheckout: "https://whop.com/checkout/plan_LYbxxyOs2ZQZk",
  deskCheckout: "https://whop.com/checkout/plan_GJwXJwksB3D0F",
  freeWhop: "https://whop.com/alpha-omega-analytics"
};
(function () {
  var cfg = window.AO_MARKETING;
  if (!cfg) return;
  var login = String(cfg.dashboardUrl || "").replace(/\/+$/, "") + String(cfg.loginPath || "/login");
  document.querySelectorAll("[data-ao-login]").forEach(function (el) {
    el.setAttribute("href", login);
  });
  document.querySelectorAll("[data-ao-desk-checkout]").forEach(function (el) {
    el.setAttribute("href", cfg.deskCheckout);
  });
  document.querySelectorAll("[data-ao-alpha-checkout]").forEach(function (el) {
    el.setAttribute("href", cfg.alphaCheckout);
  });
})();
