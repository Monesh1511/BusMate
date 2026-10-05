package com.busgo.repository;

import com.busgo.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {
    List<BookingSeat> findBySchedule_IdAndActiveTrue(Long scheduleId);
    List<BookingSeat> findByBooking_IdAndActiveTrue(Long bookingId);
}
