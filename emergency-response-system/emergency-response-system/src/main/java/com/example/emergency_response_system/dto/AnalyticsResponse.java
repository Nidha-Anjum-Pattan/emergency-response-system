package com.example.emergency_response_system.dto;

public class AnalyticsResponse {

    private long totalRequests;
    private long completedRequests;
    private long activeRequests;

    public long getTotalRequests() {
        return totalRequests;
    }

    public void setTotalRequests(long totalRequests) {
        this.totalRequests = totalRequests;
    }

    public long getCompletedRequests() {
        return completedRequests;
    }

    public void setCompletedRequests(long completedRequests) {
        this.completedRequests = completedRequests;
    }

    public long getActiveRequests() {
        return activeRequests;
    }

    public void setActiveRequests(long activeRequests) {
        this.activeRequests = activeRequests;
    }
}