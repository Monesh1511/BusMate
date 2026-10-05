package com.busgo.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AdminScheduleRequest {
    private Integer busId;
    private Integer routeId;
    private Integer boardingPointId;
    private Integer droppingPointId;
    private LocalDate travelDate;
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    private Double fare;

    public Integer getBusId() { return busId; }
    public void setBusId(Integer busId) { this.busId = busId; }
    public Integer getRouteId() { return routeId; }
    public void setRouteId(Integer routeId) { this.routeId = routeId; }
    public Integer getBoardingPointId() { return boardingPointId; }
    public void setBoardingPointId(Integer boardingPointId) { this.boardingPointId = boardingPointId; }
    public Integer getDroppingPointId() { return droppingPointId; }
    public void setDroppingPointId(Integer droppingPointId) { this.droppingPointId = droppingPointId; }
    public LocalDate getTravelDate() { return travelDate; }
    public void setTravelDate(LocalDate travelDate) { this.travelDate = travelDate; }
    public LocalTime getDepartureTime() { return departureTime; }
    public void setDepartureTime(LocalTime departureTime) { this.departureTime = departureTime; }
    public LocalTime getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(LocalTime arrivalTime) { this.arrivalTime = arrivalTime; }
    public Double getFare() { return fare; }
    public void setFare(Double fare) { this.fare = fare; }
}