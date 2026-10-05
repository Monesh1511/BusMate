package com.busgo.repository;

import com.busgo.entity.BusPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BusPerformanceRepository extends JpaRepository<BusPerformance, Long> {
    @Query("select p from BusPerformance p where p.bus.id = :busId and p.route.id = :routeId and p.cancelled = false and p.actualDeparture is not null and p.actualArrival is not null")
    List<BusPerformance> findCompleteTrips(@Param("busId") Integer busId,
                                           @Param("routeId") Integer routeId);
}
