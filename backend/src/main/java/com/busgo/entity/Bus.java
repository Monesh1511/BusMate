package com.busgo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "buses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Bus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bus_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operator_id", nullable = false)
    @JsonIgnore
    private Operator operatorRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_driver_id", nullable = false, unique = true)
    @JsonIgnore
    private Driver primaryDriver;

    @Column(name = "bus_number", nullable = false, unique = true, length = 20)
    private String busNumber;

    @Column(name = "bus_registration_number", nullable = false, unique = true, length = 30)
    private String busRegistrationNumber;

    @Column(name = "bus_type", nullable = false, length = 30)
    private String busType;

    @Column(name = "seat_capacity", nullable = false)
    private Integer seatCapacity;

    @Column(nullable = false, length = 60)
    private String model;

    @Column(name = "manufacturing_year", nullable = false)
    private Integer manufacturingYear;

    @Column(nullable = false)
    private boolean ac;

    @Column(nullable = false)
    private boolean sleeper;

    @Column(nullable = false)
    private boolean wifi;

    @Column(nullable = false)
    private boolean charging;

    @Column(nullable = false)
    private boolean blanket;

    @Column(name = "water_bottle", nullable = false)
    private boolean waterBottle;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "bus_amenities",
        joinColumns = @JoinColumn(name = "bus_id"),
        inverseJoinColumns = @JoinColumn(name = "amenity_id"))
    @JsonIgnore
    private Set<Amenity> amenityRecords = new LinkedHashSet<>();

    @OneToMany(mappedBy = "bus")
    @JsonIgnore
    private List<Schedule> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "bus")
    @JsonIgnore
    private List<Review> reviews = new ArrayList<>();

    @Transient
    private String operatorDisplay;

    @Transient
    private String amenitiesDisplay;

    public Bus() {}
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getBusNumber() { return busNumber; }
    public void setBusNumber(String busNumber) { this.busNumber = busNumber; }
    public String getBusRegistrationNumber() { return busRegistrationNumber; }
    public void setBusRegistrationNumber(String busRegistrationNumber) { this.busRegistrationNumber = busRegistrationNumber; }
    public String getBusType() { return busType; }
    public void setBusType(String busType) { this.busType = busType; }
    public Integer getSeatCapacity() { return seatCapacity; }
    public void setSeatCapacity(Integer seatCapacity) { this.seatCapacity = seatCapacity; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Integer getManufacturingYear() { return manufacturingYear; }
    public void setManufacturingYear(Integer manufacturingYear) { this.manufacturingYear = manufacturingYear; }
    public boolean isAc() { return ac; }
    public void setAc(boolean ac) { this.ac = ac; }
    public boolean isSleeper() { return sleeper; }
    public void setSleeper(boolean sleeper) { this.sleeper = sleeper; }
    public boolean isWifi() { return wifi; }
    public void setWifi(boolean wifi) { this.wifi = wifi; }
    public boolean isCharging() { return charging; }
    public void setCharging(boolean charging) { this.charging = charging; }
    public boolean isBlanket() { return blanket; }
    public void setBlanket(boolean blanket) { this.blanket = blanket; }
    public boolean isWaterBottle() { return waterBottle; }
    public void setWaterBottle(boolean waterBottle) { this.waterBottle = waterBottle; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Operator getOperatorRecord() { return operatorRecord; }
    public void setOperatorRecord(Operator operatorRecord) { this.operatorRecord = operatorRecord; }
    public Integer getOperatorId() { return operatorRecord == null ? null : operatorRecord.getId(); }
    public Driver getPrimaryDriver() { return primaryDriver; }
    public void setPrimaryDriver(Driver primaryDriver) { this.primaryDriver = primaryDriver; }
    public Integer getPrimaryDriverId() { return primaryDriver == null ? null : primaryDriver.getId(); }
    public Set<Amenity> getAmenityRecords() { return amenityRecords; }
    public void setAmenityRecords(Set<Amenity> amenityRecords) { this.amenityRecords = amenityRecords; }
    public List<Integer> getAmenityIds() {
        return amenityRecords == null ? List.of() : amenityRecords.stream().map(Amenity::getId).toList();
    }

    public String getOperator() {
        return operatorRecord == null ? operatorDisplay : operatorRecord.getName();
    }

    public void setOperator(String operator) {
        this.operatorDisplay = operator;
    }

    public String getAmenities() {
        if (amenityRecords == null || amenityRecords.isEmpty()) {
            return amenitiesDisplay;
        }
        return amenityRecords.stream().map(Amenity::getName).collect(Collectors.joining(", "));
    }

    public void setAmenities(String amenities) {
        this.amenitiesDisplay = amenities;
    }

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(status);
    }

    public void setActive(boolean active) {
        this.status = active ? "ACTIVE" : "INACTIVE";
    }

    public List<Schedule> getSchedules() { return schedules; }
    public void setSchedules(List<Schedule> schedules) { this.schedules = schedules; }
    public List<Review> getReviews() { return reviews; }
    public void setReviews(List<Review> reviews) { this.reviews = reviews; }
}
