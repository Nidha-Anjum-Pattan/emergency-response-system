import { useEffect, useState } from "react";
import api from "../services/api";

function AmbulanceDashboard() {

    const [requests, setRequests] = useState([]);
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

            loadRequests(response.data.id);

        } catch(error) {
            console.log(error);
        }
    };

    const loadRequests = async (ambulanceId) => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.get(
                `/api/emergency/ambulance/${ambulanceId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRequests(response.data);

        } catch(error) {
            console.log(error);
        }
    };

    const markEnroute = async (requestId) => {

        const token = localStorage.getItem("token");

        await api.put(
            `/api/emergency/ambulance/enroute/${requestId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        loadRequests(user.id);
    };

    const markArrived = async (requestId) => {

        const token = localStorage.getItem("token");

        await api.put(
            `/api/emergency/ambulance/arrived/${requestId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        loadRequests(user.id);
    };

    const markCompleted = async (requestId) => {

        const token = localStorage.getItem("token");

        await api.put(
            `/api/emergency/ambulance/completed/${requestId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        loadRequests(user.id);
    };

    const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
};

    return (
        <div>

            <h2>Ambulance Dashboard</h2>
            <button onClick={logout}>
                Logout
            </button>

            <p>
                Logged In User: {user?.name}
            </p>

            {requests.map(request => (

                <div key={request.id}>

                    <h4>Request #{request.id}</h4>

                    <p>Status: {request.status}</p>

                    <p>{request.description}</p>

                    {request.status === "AMBULANCE_ASSIGNED" && (
    <button onClick={() => markEnroute(request.id)}>
        ENROUTE
    </button>
)}

{request.status === "ENROUTE" && (
    <button onClick={() => markArrived(request.id)}>
        ARRIVED
    </button>
)}

{request.status === "ARRIVED" && (
    <button onClick={() => markCompleted(request.id)}>
        COMPLETED
    </button>
)}

                    <hr />

                </div>

            ))}

        </div>
    );
}

export default AmbulanceDashboard;