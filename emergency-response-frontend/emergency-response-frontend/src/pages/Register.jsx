import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("ROLE_USER");

    const navigate = useNavigate();

    const handleRegister = async () => {

        try {

            await api.post("/users", {
                name,
                email,
                phone,
                password,
                role
            });

            alert("Registration Successful");

            navigate("/");

        } catch (error) {

            console.log(error);

            if (error.response) {
                console.log(error.response.data);
            }

            alert("Registration Failed");
        }
    };

    return (
        <div>

            <h2>Register</h2>

            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <br /><br />

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <br /><br />

            <input
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
            />

            <br /><br />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <br /><br />

            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
            >
                <option value="ROLE_USER">Victim</option>
                <option value="ROLE_HOSPITAL">Hospital</option>
                <option value="ROLE_AMBULANCE">Ambulance</option>
            </select>

            <br /><br />

            <button onClick={handleRegister}>
                Register
            </button>

        </div>
    );
}

export default Register;