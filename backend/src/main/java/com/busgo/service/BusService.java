package com.busgo.service;

import com.busgo.entity.Bus;
import com.busgo.entity.Route;
import com.busgo.entity.Schedule;
import com.busgo.exception.ResourceNotFoundException;
import com.busgo.repository.BusRepository;
import com.busgo.repository.RouteRepository;
import com.busgo.repository.ReviewRepository;
import com.busgo.repository.ScheduleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class BusService {
    private final BusRepository busRepository;
    private final RouteRepository routeRepository;
    private final ScheduleRepository scheduleRepository;
    private final ReviewRepository reviewRepository;

    public BusService(BusRepository busRepository, RouteRepository routeRepository,
                      ScheduleRepository scheduleRepository, ReviewRepository reviewRepository) {
        this.busRepository = busRepository;
        this.routeRepository = routeRepository;
        this.scheduleRepository = scheduleRepository;
        this.reviewRepository = reviewRepository;
    }

    public List<Bus> getAllBuses() {
        return busRepository.findByStatus("ACTIVE");
    }

    public List<Schedule> searchSchedules(String source, String destination, LocalDate date) {
        return searchSchedules(source, destination, date, "", null, null);
    }

    public List<Schedule> searchSchedules(String source, String destination, LocalDate date, String busName,
                                          LocalTime departureAfter, LocalTime departureBefore) {
        String normalizedSource = normalizeCity(source);
        String normalizedDestination = normalizeCity(destination);
        List<Schedule> schedules = scheduleRepository.search(
            normalizedSource == null ? "" : normalizedSource,
            normalizedDestination == null ? "" : normalizedDestination,
            date
        );
        return schedules.stream()
            .filter(schedule -> busName == null || busName.isBlank()
                || schedule.getBus().getBusNumber().toLowerCase().contains(busName.trim().toLowerCase())
                || schedule.getBus().getOperator().toLowerCase().contains(busName.trim().toLowerCase()))
            .filter(schedule -> departureAfter == null || !schedule.getDepartureTime().isBefore(departureAfter))
            .filter(schedule -> departureBefore == null || !schedule.getDepartureTime().isAfter(departureBefore))
            .toList();
    }

    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Schedule getSchedule(Long scheduleId) {
        return scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));
    }

    public List<com.busgo.entity.Review> getReviews(Integer busId) {
        return busRepository.findById(busId)
            .map(bus -> reviewRepository.findByBus_IdOrderByCreatedAtDesc(busId))
            .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));
    }

    private String normalizeCity(String city) {
        if (city == null) {
            return null;
        }
        return city.trim();
    }
}
