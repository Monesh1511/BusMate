package com.busgo.repository;

import com.busgo.entity.BoardingPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardingPointRepository extends JpaRepository<BoardingPoint, Integer> {
    List<BoardingPoint> findByCity_NameOrderByNameAsc(String cityName);
}
