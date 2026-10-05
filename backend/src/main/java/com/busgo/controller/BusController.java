package com.busgo.controller;

import com.busgo.entity.Bus;
import com.busgo.entity.City;
import com.busgo.entity.Route;
import com.busgo.entity.Schedule;
import com.busgo.repository.CityRepository;
import com.busgo.service.BusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api")
public class BusController {

    private final BusService busService;
    private final CityRepository cityRepository;

    public BusController(BusService busService, CityRepository cityRepository) {
        this.busService = busService;
        this.cityRepository = cityRepository;
    }

    @GetMapping("/buses")
    public ResponseEntity<List<Bus>> getAllBuses() {
        return ResponseEntity.ok(busService.getAllBuses());
    }

    @GetMapping("/routes")
    public ResponseEntity<List<Route>> getAllRoutes() {
        return ResponseEntity.ok(busService.getAllRoutes());
    }

    @GetMapping("/routes/cities")
    public ResponseEntity<List<City>> getCities() {
        return ResponseEntity.ok(cityRepository.findAll());
    }

    @GetMapping("/buses/search")
    public ResponseEntity<List<Schedule>> searchBuses(@RequestParam(defaultValue = "") String from,
                                                    @RequestParam(defaultValue = "") String to,
                                                    @RequestParam LocalDate date,
                                                    @RequestParam(defaultValue = "") String busName,
                                                    @RequestParam(required = false) LocalTime departureAfter,
                                                    @RequestParam(required = false) LocalTime departureBefore) {
        return ResponseEntity.ok(busService.searchSchedules(from, to, date, busName, departureAfter, departureBefore));
    }

    @GetMapping("/buses/{busId}/reviews")
    public ResponseEntity<List<com.busgo.entity.Review>> getReviews(@PathVariable Integer busId) {
        return ResponseEntity.ok(busService.getReviews(busId));
    }
}
