package com.valkai.sikkal.controller;

import com.valkai.sikkal.entity.Finance;
import com.valkai.sikkal.repository.FinanceRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "http://localhost:5173")
public class FinanceController {

    private final FinanceRepository financeRepository;

    public FinanceController(FinanceRepository financeRepository) {
        this.financeRepository = financeRepository;
    }

    // GET all or by date
    @GetMapping
    public List<Finance> getFinance(@RequestParam(required = false) String date) {
        if (date != null) {
            return financeRepository.findByDate(date);
        }
        return financeRepository.findAll();
    }

    // POST
    @PostMapping
    public Finance addFinance(@RequestBody Finance finance) {
        return financeRepository.save(finance);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteFinance(@PathVariable Long id) {
        financeRepository.deleteById(id);
    }
}
