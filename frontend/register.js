const registerForm = document.getElementById("register-form");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm_password").value;
  const name = document.getElementById("name").value;
  const firstname = document.getElementById("firstname").value;

  if (password !== confirmPassword) {
    alert("Passwords doesn't match !");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, firstname }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Account created sucessfully !");
      window.location.href = "/login.html";
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
    alert("Error while registering");
  }
});
