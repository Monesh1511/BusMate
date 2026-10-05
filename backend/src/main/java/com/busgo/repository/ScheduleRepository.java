package com.busgo.repository;

import com.busgo.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
  long countByStatus(String status);
  List<Schedule> findByRoute_SourceCity_NameAndRoute_DestinationCity_NameAndTravelDateAndStatus(
      String source, String destination, LocalDate date, String status);
    List<Schedule> findByBus_Id(Integer busId);
    List<Schedule> findByRoute_Id(Integer routeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Schedule s where s.id = :scheduleId")
    Optional<Schedule> findByIdForUpdate(@Param("scheduleId") Long scheduleId);

    @Query("""
        select distinct s from Schedule s
        join fetch s.bus b
        join fetch s.route r
        left join fetch b.reviews
        where s.status = 'SCHEDULED'
          and s.travelDate = :date
          and (:source = '' or lower(r.sourceCity.name) like lower(concat('%', :source, '%')))
          and (:destination = '' or lower(r.destinationCity.name) like lower(concat('%', :destination, '%')))
        order by s.departureAt
        """)
    List<Schedule> search(@Param("source") String source,
                          @Param("destination") String destination,
                          @Param("date") LocalDate date);
}
