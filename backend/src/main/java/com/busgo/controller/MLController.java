package com.busgo.controller;

import com.busgo.service.MLService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/ml")
public class MLController {
    private final MLService mlService;

    public MLController(MLService mlService) {
        this.mlService = mlService;
    }

    @GetMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> recommendations(@RequestParam String from,
                                                               @RequestParam String to,
                                                               @RequestParam LocalDate date) {
        return ResponseEntity.ok(mlService.recommend(from, to, date));
    }

    @GetMapping("/delay/{scheduleId}")
    public ResponseEntity<Map<String, Object>> delay(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(mlService.predictDelay(scheduleId));
    }

    @PostMapping("/review-analysis")
    public ResponseEntity<Map<String, Object>> reviewAnalysis(@RequestBody Map<String, Object> request) {
        Object rawBusId = request.get("busId");
        Integer busId = rawBusId instanceof Number number ? number.intValue() : null;
        String text = String.valueOf(request.getOrDefault("text", ""));
        return ResponseEntity.ok(mlService.analyzeReview(busId, text));
    }
}