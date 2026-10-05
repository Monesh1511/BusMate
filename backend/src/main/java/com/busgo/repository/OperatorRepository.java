package com.busgo.repository;

import com.busgo.entity.Operator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OperatorRepository extends JpaRepository<Operator, Integer> {
	Optional<Operator> findByNameIgnoreCase(String name);
}
