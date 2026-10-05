package com.busgo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.FetchType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Transient;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "routes", uniqueConstraints =
    @UniqueConstraint(columnNames = {"source_city", "destination_city"}))
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_city", referencedColumnName = "city_name", nullable = false)
    @JsonIgnore
    private City sourceCity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_city", referencedColumnName = "city_name", nullable = false)
    @JsonIgnore
    private City destinationCity;

    @Column(name = "distance_km", nullable = false)
    private Integer distanceKm;

    @Column(name = "estimated_duration_minutes", nullable = false)
    private Integer estimatedDurationMinutes;

    @OneToMany(mappedBy = "route")
    @JsonIgnore
    private List<Schedule> schedules = new ArrayList<>();

    @Transient
    private String boardingPoints;

    @Transient
    private String droppingPoints;

    @Transient
    private String sourceDisplay;

    @Transient
    private String destinationDisplay;

    public Route() {}
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getSource() { return sourceCity == null ? sourceDisplay : sourceCity.getName(); }
    public void setSource(String source) { this.sourceDisplay = source; }
    public City getSourceCity() { return sourceCity; }
    public void setSourceCity(City sourceCity) { this.sourceCity = sourceCity; }
    public String getDestination() { return destinationCity == null ? destinationDisplay : destinationCity.getName(); }
    public void setDestination(String destination) { this.destinationDisplay = destination; }
    public City getDestinationCity() { return destinationCity; }
    public void setDestinationCity(City destinationCity) { this.destinationCity = destinationCity; }
    public Integer getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Integer distanceKm) { this.distanceKm = distanceKm; }
    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
    public List<Schedule> getSchedules() { return schedules; }
    public void setSchedules(List<Schedule> schedules) { this.schedules = schedules; }
    public String getBoardingPoints() { return boardingPoints; }
    public void setBoardingPoints(String boardingPoints) { this.boardingPoints = boardingPoints; }
    public String getDroppingPoints() { return droppingPoints; }
    public void setDroppingPoints(String droppingPoints) { this.droppingPoints = droppingPoints; }
}
