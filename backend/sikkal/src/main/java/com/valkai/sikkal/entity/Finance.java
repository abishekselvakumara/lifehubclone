package com.valkai.sikkal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "finance")
public class Finance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;
    private Double amount;
    private String type;      // income / expense
    private String category;
    private String date;

    public Finance() {}

    public Finance(String description, Double amount, String type, String category, String date) {
        this.description = description;
        this.amount = amount;
        this.type = type;
        this.category = category;
        this.date = date;
    }

    public Long getId() { return id; }
    public String getDescription() { return description; }
    public Double getAmount() { return amount; }
    public String getType() { return type; }
    public String getCategory() { return category; }
    public String getDate() { return date; }

    public void setId(Long id) { this.id = id; }
    public void setDescription(String description) { this.description = description; }
    public void setAmount(Double amount) { this.amount = amount; }
    public void setType(String type) { this.type = type; }
    public void setCategory(String category) { this.category = category; }
    public void setDate(String date) { this.date = date; }
}
