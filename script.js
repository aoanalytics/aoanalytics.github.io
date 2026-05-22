const DISCORD_INVITE_URL = "https://discord.com/invite/replace-me";

function wireDiscordLinks() {
  const links = document.querySelectorAll(".discord-link");
  links.forEach((link) => {
    if (DISCORD_INVITE_URL.includes("replace-me")) {
      link.setAttribute("href", "https://x.com/AO_Analytics");
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
      link.textContent = link.classList.contains("header-action") ? "Invite" : "Request Invite";
      link.addEventListener("click", (event) => {
        if (!link.closest(".site-footer")) return;
        event.preventDefault();
        window.open("https://x.com/AO_Analytics", "_blank", "noopener");
      });
      return;
    }

    link.setAttribute("href", DISCORD_INVITE_URL);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  });
}

wireDiscordLinks();
