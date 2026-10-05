package com.busgo.dto;

public class AuthResponse {
    private String token;
    private String name;
    private String email;
    private String role;
    private Long userId;

    public AuthResponse() {
    }

    public AuthResponse(String token, String name, String email, String role, Long userId) {
        this.token = token;
        this.name = name;
        this.email = email;
        this.role = role;
        this.userId = userId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
