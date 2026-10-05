package com.busgo.service;

import com.busgo.dto.AuthRequest;
import com.busgo.dto.AuthResponse;
import com.busgo.dto.RegisterRequest;
import com.busgo.entity.User;
import com.busgo.exception.BusinessException;
import com.busgo.model.Role;
import com.busgo.repository.UserRepository;
import com.busgo.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      AuthenticationManager authenticationManager,
                      JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("User already exists with this email");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(Role.CUSTOMER);
        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());
        return new AuthResponse(token, savedUser.getName(), savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());
    }

    public AuthResponse login(AuthRequest request) {
        String email = normalizeEmail(request.getEmail());
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        if (!authentication.isAuthenticated()) {
            throw new BusinessException("Invalid credentials");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found"));

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole().name(), user.getId());
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
            .orElseThrow(() -> new BusinessException("User not found"));
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BusinessException("Email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
