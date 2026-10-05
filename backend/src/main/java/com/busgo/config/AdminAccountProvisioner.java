package com.busgo.config;

import com.busgo.entity.User;
import com.busgo.model.Role;
import com.busgo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "busgo.admin.bootstrap", name = "enabled", havingValue = "true")
public class AdminAccountProvisioner implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String name;
    private final String phone;
    private final String password;

    public AdminAccountProvisioner(UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   @Value("${busgo.admin.bootstrap.email:}") String email,
                                   @Value("${busgo.admin.bootstrap.name:BusGo Admin}") String name,
                                   @Value("${busgo.admin.bootstrap.phone:}") String phone,
                                   @Value("${busgo.admin.bootstrap.password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.trim();
        this.name = name.trim();
        this.phone = phone.trim();
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (email.isBlank()) {
            throw new IllegalStateException("BUSGO_ADMIN_EMAIL is required when admin bootstrap is enabled");
        }

        User admin = userRepository.findByEmail(email).orElseGet(User::new);
        boolean isNew = admin.getId() == null;
        if (isNew && (name.isBlank() || phone.isBlank() || password.isBlank())) {
            throw new IllegalStateException("BUSGO_ADMIN_NAME, BUSGO_ADMIN_PHONE, and BUSGO_ADMIN_PASSWORD are required to create an admin");
        }
        if (admin.getPasswordHash() == null && password.isBlank()) {
            throw new IllegalStateException("BUSGO_ADMIN_PASSWORD is required to enable password login for this admin");
        }

        if (isNew) {
            admin.setName(name);
            admin.setEmail(email);
            admin.setPhone(phone);
        }
        admin.setRole(Role.ADMIN);
        if (admin.getPasswordHash() == null) {
            admin.setPasswordHash(passwordEncoder.encode(password));
        }
        userRepository.save(admin);
    }
}