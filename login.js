function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
  
    if (user === "admin" && pass === "1234") {
      localStorage.setItem("auth", "true");
      window.location.href = "index.html";
    } else {
      alert("Invalid credentials.\nUsername: admin\nPassword: 1234");
    }
  }
  