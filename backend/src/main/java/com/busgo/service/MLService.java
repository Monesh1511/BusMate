package com.busgo.service;

import com.busgo.entity.Bus;
import com.busgo.entity.BusPerformance;
import com.busgo.entity.Review;
import com.busgo.entity.Schedule;
import com.busgo.repository.BusPerformanceRepository;
import com.busgo.repository.BusRepository;
import com.busgo.repository.ReviewRepository;
import com.busgo.repository.ScheduleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MLService {
    private static final Logger logger = LoggerFactory.getLogger(MLService.class);
    private final BusService busService;
    private final BusRepository busRepository;
    private final ScheduleRepository scheduleRepository;
    private final BusPerformanceRepository busPerformanceRepository;
    private final ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient client = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .build();
    private final String mlUrl;

    public MLService(BusService busService, BusRepository busRepository,
                     ScheduleRepository scheduleRepository, BusPerformanceRepository busPerformanceRepository,
                     ReviewRepository reviewRepository, ObjectMapper objectMapper,
                     @Value("${ml.service.url:http://127.0.0.1:8000}") String mlUrl) {
        this.busService = busService;
        this.busRepository = busRepository;
        this.scheduleRepository = scheduleRepository;
        this.busPerformanceRepository = busPerformanceRepository;
        this.reviewRepository = reviewRepository;
        this.objectMapper = objectMapper;
        this.mlUrl = mlUrl;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> recommend(String source, String destination, LocalDate date) {
        List<Schedule> schedules = busService.searchSchedules(source, destination, date);
        if (schedules.isEmpty()) {
            return Map.of(
                "status", "INSUFFICIENT_DATA",
                "model", "bus-recommendation-logistic-v1",
                "message", "No live schedules are available for this search.",
                "recommendations", List.of()
            );
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("schedules", schedules.stream().map(this::schedulePayload).toList());
            payload.put("trainingBuses", trainingBuses());
            return post("/ml/recommend/buses", payload);
        } catch (Exception exception) {
            logger.warn("ML recommendation request failed: {}", exception.getMessage());
            return Map.of(
                "status", "UNAVAILABLE",
                "model", "bus-recommendation-logistic-v1",
                "message", "Recommendations are temporarily unavailable; live schedules remain available.",
                "recommendations", List.of()
            );
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> predictDelay(Long scheduleId) {
        Schedule schedule = busService.getSchedule(scheduleId);
        List<Map<String, Object>> history = busPerformanceRepository
            .findCompleteTrips(schedule.getBus().getId(), schedule.getRoute().getId())
            .stream()
            .map(this::performancePayload)
            .toList();

        Map<String, Object> payload = new HashMap<>();
        payload.put("departureTime", schedule.getDepartureAt().toString());
        payload.put("dayOfWeek", schedule.getTravelDate().getDayOfWeek().getValue());
        payload.put("distanceKm", schedule.getRoute().getDistanceKm());
        payload.put("history", history);
        try {
            return post("/ml/predict/delay", payload);
        } catch (Exception exception) {
            logger.warn("ML delay request failed: {}", exception.getMessage());
            Map<String, Object> unavailable = new HashMap<>();
            unavailable.put("status", "UNAVAILABLE");
            unavailable.put("predictedDelayMinutes", null);
            unavailable.put("confidence", "none");
            unavailable.put("message", "Delay prediction is unavailable; use the published arrival time.");
            return unavailable;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> analyzeReview(Integer busId, String text) {
        List<Map<String, Object>> trainingReviews = reviewRepository.findAll().stream()
            .map(this::reviewTrainingPayload)
            .toList();
        Map<String, Object> payload = new HashMap<>();
        payload.put("text", text == null ? "" : text);
        payload.put("busId", busId);
        payload.put("trainingReviews", trainingReviews);
        try {
            return post("/ml/analyze/review", payload);
        } catch (Exception exception) {
            logger.warn("ML review analysis request failed: {}", exception.getMessage());
            return Map.of(
                "status", "UNAVAILABLE",
                "sentiment", "INSUFFICIENT_DATA",
                "aspects", List.of(),
                "message", "Review analysis is unavailable; original reviews remain visible."
            );
        }
    }

    private List<Map<String, Object>> trainingBuses() {
        List<Schedule> historicalSchedules = scheduleRepository.findAll();
        Map<Integer, List<Double>> faresByBus = new HashMap<>();
        for (Schedule schedule : historicalSchedules) {
            faresByBus.computeIfAbsent(schedule.getBus().getId(), ignored -> new ArrayList<>())
                .add(schedule.getFare().doubleValue());
        }

        List<Map<String, Object>> training = new ArrayList<>();
        for (Bus bus : busRepository.findAllWithOperatorAndReviews()) {
            List<Review> reviews = bus.getReviews();
            List<Double> ratings = reviews.stream().map(review -> review.getRating().doubleValue()).toList();
            List<Double> fares = faresByBus.get(bus.getId());
            if (ratings.isEmpty() || fares == null || fares.isEmpty()) {
                continue;
            }
            double averageRating = ratings.stream().mapToDouble(Double::doubleValue).average().orElseThrow();
            double averageFare = fares.stream().mapToDouble(Double::doubleValue).average().orElseThrow();
            double operatorRating = bus.getOperatorRecord().getRating().doubleValue();
            training.add(Map.of(
                "id", bus.getId(),
                "averageRating", averageRating,
                "averageFare", averageFare,
                "seatCapacity", bus.getSeatCapacity(),
                "operatorRating", operatorRating,
                "ac", bus.isAc(),
                "sleeper", bus.isSleeper()
            ));
        }
        return training;
    }

    private Map<String, Object> schedulePayload(Schedule schedule) {
        Bus bus = schedule.getBus();
        Map<String, Object> busPayload = Map.of(
            "busNumber", bus.getBusNumber(),
            "busType", bus.getBusType(),
            "seatCapacity", bus.getSeatCapacity(),
            "operatorRating", bus.getOperatorRecord().getRating().doubleValue(),
            "ac", bus.isAc(),
            "sleeper", bus.isSleeper()
        );
        Map<String, Object> item = new HashMap<>();
        item.put("id", schedule.getId());
        item.put("fare", schedule.getFare().doubleValue());
        item.put("routeMedianFare", schedule.getFare().doubleValue());
        item.put("bus", busPayload);
        return item;
    }

    private Map<String, Object> performancePayload(BusPerformance performance) {
        Integer observedDelay = performance.getDelayMinutes();
        if (observedDelay == null && performance.getActualArrival() != null) {
            observedDelay = Math.toIntExact(Duration.between(
                performance.getScheduledArrival(), performance.getActualArrival()).toMinutes());
        }
        Map<String, Object> item = new HashMap<>();
        item.put("departureTime", performance.getScheduledDeparture().toString());
        item.put("dayOfWeek", performance.getTravelDate().getDayOfWeek().getValue());
        item.put("distanceKm", performance.getRoute().getDistanceKm());
        item.put("delayMinutes", observedDelay == null ? null : Math.max(0, observedDelay));
        item.put("cancelled", performance.isCancelled());
        return item;
    }

    private Map<String, Object> reviewTrainingPayload(Review review) {
        return Map.of(
            "reviewText", review.getComment(),
            "rating", review.getRating(),
            "cleanlinessRating", review.getCleanlinessRating(),
            "comfortRating", review.getComfortRating(),
            "punctualityRating", review.getPunctualityRating(),
            "staffRating", review.getStaffRating(),
            "boardingRating", review.getBoardingRating()
        );
    }

    private Map<String, Object> post(String path, Object payload) throws Exception {
        byte[] body = objectMapper.writeValueAsBytes(payload);
        HttpRequest request = HttpRequest.newBuilder(URI.create(mlUrl + path))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofByteArray(body))
            .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("ML service returned HTTP " + response.statusCode() + ": " + response.body());
        }
        return objectMapper.readValue(response.body(), new TypeReference<>() {});
    }
}
