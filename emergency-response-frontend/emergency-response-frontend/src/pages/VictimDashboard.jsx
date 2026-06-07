import { useEffect, useState } from "react";
import api from "../services/api";

function VictimDashboard() {

    const [user, setUser] = useState(null);

    useEffect(() => {
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.get(
                "/users/me",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUser(response.data);

        } catch(error) {
            console.log(error);
        }
    };

    const createSOS = async () => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.post(
                `/api/emergency/sos/${user.id}?latitude=16.3067&longitude=80.4365&description=Emergency`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data);

            alert("SOS Created Successfully");

        } catch(error) {

            console.log(error);

            alert("Failed");
        }
    };
    const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
};

    return (
        <div>

            <h1>Victim Dashboard</h1>
            <button onClick={logout}>
    Logout
</button>
            <p>
                Logged In User: {user?.name}
            </p>

            <button onClick={createSOS}>
                Create SOS
            </button>
            

        </div>
    );
}

export default VictimDashboard;