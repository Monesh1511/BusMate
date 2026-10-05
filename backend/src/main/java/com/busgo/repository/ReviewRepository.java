package com.busgo.repository;

import com.busgo.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBus_IdOrderByCreatedAtDesc(Integer busId);
    boolean existsByBus_Id(Integer busId);
    boolean existsByBooking_Id(Long bookingId);
}