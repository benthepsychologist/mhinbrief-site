/* review-feedback.js — submits the /review/ page's per-item feedback form
   to the Worker's /api/feedback route (worker/index.js), which verifies
   the submitter's Cloudflare Access login (server-side, from a signed
   header — see access-jwt.js) and opens a GitHub issue attributed to that
   verified email. No name field: identity comes from the login, not a
   text box. Progressive: forms work with JS off too (they'd just POST
   and reload on a browser default — acceptable degraded case for an
   internal review tool, not attempted to be prevented here). */
(function () {
  var forms = document.querySelectorAll(".review-feedback");
  forms.forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var status = form.querySelector(".review-feedback-status");
      var candidateId = form.getAttribute("data-candidate-id");
      var comment = form.elements.comment.value.trim();
      if (!comment) return;

      var button = form.querySelector("button");
      button.disabled = true;
      status.textContent = "Sending…";

      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, comment: comment }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("request failed");
          status.textContent = "Sent — thank you.";
          form.reset();
        })
        .catch(function () {
          status.textContent = "Couldn't send that — try again in a moment.";
        })
        .finally(function () {
          button.disabled = false;
        });
    });
  });
})();
