package com.busgo.repository;

import com.busgo.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Integer> {
    List<Route> findBySourceCity_NameAndDestinationCity_Name(String source, String destination);
}
