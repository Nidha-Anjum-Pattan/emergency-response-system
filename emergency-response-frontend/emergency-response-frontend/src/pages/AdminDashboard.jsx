import { useEffect, useState } from "react";
import api from "../services/api";

function AdminDashboard() {

    const [requests, setRequests] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
    loadRequests();
    loadAnalytics();
    }, []);

    const loadRequests = async () => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.get(
                "/api/emergency/all",
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

    const loadAnalytics = async () => {

    try {

        const token = localStorage.getItem("token");

        const response = await api.get(
            "/api/emergency/stats",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setAnalytics(response.data);

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

            <h1>Admin Dashboard</h1>

            <button onClick={logout}>
                Logout
            </button>

            <h3>
                Total Requests: {requests.length}
            </h3>

            {requests.map(request => (

                <div key={request.id}>

                    <h4>Request #{request.id}</h4>

                    <p>
                        Status: {request.status}
                    </p>

                    <p>
                        Description: {request.description}
                    </p>

                    <p>
                        Victim: {request.victim?.name}
                    </p>

                    <p>
                        Hospital: {request.hospital?.name}
                    </p>

                    <p>
                        Ambulance: {request.ambulance?.name}
                    </p>

                    <hr />

                </div>

            ))}
            <h2>Analytics</h2>

<p>
    Total Requests: {analytics?.totalRequests}
</p>

<p>
    Completed Requests: {analytics?.completedRequests}
</p>

<p>
    Active Requests: {analytics?.activeRequests}
</p>

<hr />

        </div>
    );
}

export default AdminDashboard;