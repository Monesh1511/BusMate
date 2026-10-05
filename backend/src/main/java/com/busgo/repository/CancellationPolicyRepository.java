package com.busgo.repository;

import com.busgo.entity.CancellationPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CancellationPolicyRepository extends JpaRepository<CancellationPolicy, Long> {
    List<CancellationPolicy> findBySchedule_IdOrderByHoursBeforeDepartureDesc(Long scheduleId);
}
