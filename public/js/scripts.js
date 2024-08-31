/* eslint-disable no-unused-vars */

// validate Password

function validatePasswords() {
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorMessage = document.getElementById("error-message");

  if (newPassword !== confirmPassword) {
    errorMessage.textContent =
      "New Password and Confirm Password do not match.";
    errorMessage.classList.remove("hidden");
    return false; // Prevent form submission
  }

  errorMessage.classList.add("hidden");
  return true; // Allow form submission
}
