package com.busgo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "boarding_points", uniqueConstraints =
    @UniqueConstraint(columnNames = {"city_name", "point_name"}))
public class BoardingPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "point_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_name", referencedColumnName = "city_name", nullable = false)
    @JsonIgnore
    private City city;

    @Transient
    private String cityNameDisplay;

    @Column(name = "point_name", nullable = false, length = 80)
    private String name;

    public BoardingPoint() {}
    public Integer getId() { return id; }
    public String getCityName() { return city == null ? cityNameDisplay : city.getName(); }
    public void setCityName(String cityName) { this.cityNameDisplay = cityName; }
    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }
    public String getName() { return name; }
}
