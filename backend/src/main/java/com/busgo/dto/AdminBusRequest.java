package com.busgo.dto;

import java.util.ArrayList;
import java.util.List;

public class AdminBusRequest {
    private String busNumber;
    private String busRegistrationNumber;
    private Integer operatorId;
    private Integer primaryDriverId;
    private String busType;
    private Integer seatCapacity;
    private String model;
    private Integer manufacturingYear;
    private boolean ac;
    private boolean sleeper;
    private boolean wifi;
    private boolean charging;
    private boolean blanket;
    private boolean waterBottle;
    private String status = "ACTIVE";
    private List<Integer> amenityIds = new ArrayList<>();

    public String getBusNumber() { return busNumber; }
    public void setBusNumber(String busNumber) { this.busNumber = busNumber; }
    public String getBusRegistrationNumber() { return busRegistrationNumber; }
    public void setBusRegistrationNumber(String busRegistrationNumber) { this.busRegistrationNumber = busRegistrationNumber; }
    public Integer getOperatorId() { return operatorId; }
    public void setOperatorId(Integer operatorId) { this.operatorId = operatorId; }
    public Integer getPrimaryDriverId() { return primaryDriverId; }
    public void setPrimaryDriverId(Integer primaryDriverId) { this.primaryDriverId = primaryDriverId; }
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
    public List<Integer> getAmenityIds() { return amenityIds; }
    public void setAmenityIds(List<Integer> amenityIds) { this.amenityIds = amenityIds; }
}
