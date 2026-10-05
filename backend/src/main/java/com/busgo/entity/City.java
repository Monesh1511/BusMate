package com.busgo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "cities")
public class City {
    @Id
    @Column(name = "city_id")
    private Integer id;

    @Column(name = "city_name", nullable = false, unique = true)
    private String name;

    @Column(name = "state_code", nullable = false)
    private String stateCode;

    @Column(name = "state_name", nullable = false)
    private String stateName;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal longitude;

    public City() {}
    public Integer getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStateCode() { return stateCode; }
    public String getStateName() { return stateName; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
}
