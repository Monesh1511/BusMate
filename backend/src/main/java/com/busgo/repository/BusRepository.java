package com.busgo.repository;

import com.busgo.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BusRepository extends JpaRepository<Bus, Integer> {

    List<Bus> findByStatus(String status);

    long countByStatus(String status);

    @EntityGraph(attributePaths = {"operatorRecord", "reviews"})
    @Query("SELECT b FROM Bus b")
    List<Bus> findAllWithOperatorAndReviews();
}