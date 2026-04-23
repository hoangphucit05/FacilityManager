$(function onLoginPageReady() {
  const $form = $("#loginForm");
  const $error = $("#loginError");

  $form.on("submit", function handleLoginSubmit(event) {
    event.preventDefault();
    $error.hide();

    const username = ($("#username").val() || "").trim();
    const password = ($("#password").val() || "").trim();
    const result = window.AppAuth.login(username, password);

    if (!result.ok) {
      $error.text(result.message).show();
      return;
    }

    const role = result.user.role;
    const home = window.AppAuth.getDefaultHomeByRole(role);
    window.location.href = home;
  });
});
