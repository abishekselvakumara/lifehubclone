package com.valkai.sikkal.repository;

import com.valkai.sikkal.entity.Finance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinanceRepository extends JpaRepository<Finance, Long> {
    List<Finance> findByDate(String date);
}
