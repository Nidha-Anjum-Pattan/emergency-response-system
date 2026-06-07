import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";


function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {

  try {

    const response = await api.post(
      "/auth/login",
      {
        email,
        password
      }
    );

    const token = response.data;

localStorage.setItem(
    "token",
    token
);

const decoded = jwtDecode(token);

const role = decoded.role;

console.log("Token Saved");
console.log("Role:", role);

if (role === "ROLE_USER") {
    navigate("/victim");
}
else if (role === "ROLE_HOSPITAL") {
    navigate("/hospital");
}
else if (role === "ROLE_AMBULANCE") {
    navigate("/ambulance");
}
else if (role === "ROLE_ADMIN") {
    navigate("/admin");
}

  } catch (error) {
    console.log("ERROR:", error);

    if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
    }

    alert("Login Failed");
}
};

  return (
    <div>

      <h2>Emergency Response System</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleLogin}>
        Login
        </button>
        <br />
<br />

        <Link to="/register">
        Register Here
        </Link>

    </div>
  );
}

export default Login;