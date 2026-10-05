package com.busgo.controller;

import com.busgo.repository.BusRepository;
import com.busgo.repository.RouteRepository;
import com.busgo.repository.ScheduleRepository;
import com.busgo.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {
    private final UserRepository userRepository;
    private final BusRepository busRepository;
    private final RouteRepository routeRepository;
    private final ScheduleRepository scheduleRepository;

    public HomeController(UserRepository userRepository, BusRepository busRepository,
                          RouteRepository routeRepository, ScheduleRepository scheduleRepository) {
        this.userRepository = userRepository;
        this.busRepository = busRepository;
        this.routeRepository = routeRepository;
        this.scheduleRepository = scheduleRepository;
    }

    @GetMapping("/")
    public Map<String, Object> home() {
        return Map.of(
            "name", "BusGo API",
            "status", "running",
            "message", "Use /api/auth/login or /api/buses to interact with the service."
        );
    }

    @GetMapping("/api/home/metrics")
    public ResponseEntity<Map<String, Long>> metrics() {
        Map<String, Long> metrics = new HashMap<>();
        metrics.put("users", userRepository.count());
        metrics.put("activeBuses", busRepository.countByStatus("ACTIVE"));
        metrics.put("routes", routeRepository.count());
        metrics.put("scheduledTrips", scheduleRepository.countByStatus("SCHEDULED"));
        return ResponseEntity.ok(metrics);
    }
}
