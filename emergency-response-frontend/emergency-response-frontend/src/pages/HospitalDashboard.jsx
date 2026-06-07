import { useEffect, useState } from "react";
import api from "../services/api";

function HospitalDashboard() {

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

    const loadRequests = async (hospitalId) => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.get(
                `/api/emergency/hospital/${hospitalId}`,
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

    const acceptRequest = async (requestId) => {

        try {

            const token = localStorage.getItem("token");

            await api.put(
                `/api/emergency/hospital/accept/${requestId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            loadRequests(user.id);

        } catch(error) {
            console.log(error);
        }
    };

    const rejectRequest = async (requestId) => {

        try {

            const token = localStorage.getItem("token");

            await api.put(
                `/api/emergency/hospital/reject/${requestId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            loadRequests(user.id);

        } catch(error) {
            console.log(error);
        }
    };

    const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
};

    return (
        <div>

            <h1>Hospital Dashboard</h1>
            <button onClick={logout}>
                Logout
            </button>

            <p>
                Logged In User: {user?.name}
            </p>

            {requests.map(request => (

                <div key={request.id}>

                    <h3>Request #{request.id}</h3>

                    <p>Status: {request.status}</p>

                    <p>Description: {request.description}</p>

                    <button onClick={() => acceptRequest(request.id)}>
                        Accept
                    </button>

                    <button onClick={() => rejectRequest(request.id)}>
                        Reject
                    </button>

                    <hr />

                </div>

            ))}

        </div>
    );
}

export default HospitalDashboard;