package com.busgo.controller;

import com.busgo.dto.AdminBusRequest;
import com.busgo.dto.AdminDriverRequest;
import com.busgo.dto.AdminScheduleRequest;
import com.busgo.entity.Amenity;
import com.busgo.entity.BoardingPoint;
import com.busgo.entity.Bus;
import com.busgo.entity.City;
import com.busgo.entity.Driver;
import com.busgo.entity.Operator;
import com.busgo.entity.Route;
import com.busgo.entity.Schedule;
import com.busgo.repository.AmenityRepository;
import com.busgo.repository.BoardingPointRepository;
import com.busgo.repository.BookingRepository;
import com.busgo.repository.BusRepository;
import com.busgo.repository.CityRepository;
import com.busgo.repository.DriverRepository;
import com.busgo.repository.OperatorRepository;
import com.busgo.repository.RouteRepository;
import com.busgo.repository.ScheduleRepository;
import com.busgo.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BusRepository busRepository;
    private final RouteRepository routeRepository;
    private final ScheduleRepository scheduleRepository;
    private final CityRepository cityRepository;
    private final OperatorRepository operatorRepository;
    private final DriverRepository driverRepository;
    private final AmenityRepository amenityRepository;
    private final BoardingPointRepository boardingPointRepository;

    public AdminController(UserRepository userRepository, BookingRepository bookingRepository,
                           BusRepository busRepository, RouteRepository routeRepository,
                           ScheduleRepository scheduleRepository, CityRepository cityRepository,
                           OperatorRepository operatorRepository, DriverRepository driverRepository,
                           AmenityRepository amenityRepository, BoardingPointRepository boardingPointRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.busRepository = busRepository;
        this.routeRepository = routeRepository;
        this.scheduleRepository = scheduleRepository;
        this.cityRepository = cityRepository;
        this.operatorRepository = operatorRepository;
        this.driverRepository = driverRepository;
        this.amenityRepository = amenityRepository;
        this.boardingPointRepository = boardingPointRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userCount", userRepository.count());
        payload.put("bookingCount", bookingRepository.count());
        payload.put("busCount", busRepository.count());
        payload.put("routeCount", routeRepository.count());
        payload.put("scheduleCount", scheduleRepository.count());
        payload.put("status", "ready");
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/cities")
    public List<City> cities() { return cityRepository.findAll(); }

    @GetMapping("/operators")
    public List<Operator> operators() { return operatorRepository.findAll(); }

    @GetMapping("/drivers")
    public List<Driver> drivers() { return driverRepository.findAll(); }

    @PostMapping("/drivers")
    public Driver createDriver(@RequestBody AdminDriverRequest request) {
        if (request.getName() == null || request.getName().isBlank()
                || request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()
                || request.getExperienceYears() == null || request.getLicenseType() == null
                || request.getRating() == null) {
            throw new IllegalArgumentException("Name, phone, experience, license type, and rating are required");
        }
        Driver driver = new Driver();
        driver.setName(request.getName().trim());
        driver.setPhoneNumber(request.getPhoneNumber().trim());
        driver.setExperienceYears(request.getExperienceYears());
        driver.setLicenseType(request.getLicenseType().trim());
        driver.setRating(BigDecimal.valueOf(request.getRating()));
        return driverRepository.save(driver);
    }

    @GetMapping("/amenities")
    public List<Amenity> amenities() { return amenityRepository.findAll(); }

    @GetMapping("/boarding-points")
    public List<BoardingPoint> boardingPoints(@RequestParam(required = false) String city) {
        return city == null || city.isBlank()
            ? boardingPointRepository.findAll()
            : boardingPointRepository.findByCity_NameOrderByNameAsc(city.trim());
    }

    @GetMapping("/buses")
    public List<Bus> buses() { return busRepository.findAll(); }

    @PostMapping("/buses")
    @Transactional
    public Bus createBus(@RequestBody AdminBusRequest request) {
        return busRepository.save(applyBus(new Bus(), request));
    }

    @PutMapping("/buses/{id}")
    @Transactional
    public Bus updateBus(@PathVariable Integer id, @RequestBody AdminBusRequest request) {
        Bus bus = busRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        return busRepository.save(applyBus(bus, request));
    }

    @GetMapping("/routes")
    public List<Route> routes() { return routeRepository.findAll(); }

    @PostMapping("/routes")
    @Transactional
    public Route createRoute(@RequestBody Route request) {
        request.setSourceCity(requireCity(request.getSource()));
        request.setDestinationCity(requireCity(request.getDestination()));
        request.setId(null);
        return routeRepository.save(request);
    }

    @PutMapping("/routes/{id}")
    @Transactional
    public Route updateRoute(@PathVariable Integer id, @RequestBody Route request) {
        Route route = routeRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Route not found"));
        route.setSourceCity(requireCity(request.getSource()));
        route.setDestinationCity(requireCity(request.getDestination()));
        route.setDistanceKm(request.getDistanceKm());
        route.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        return routeRepository.save(route);
    }

    @GetMapping("/schedules")
    public List<Schedule> schedules() { return scheduleRepository.findAll(); }

    @PostMapping("/schedules")
    @Transactional
    public Schedule createSchedule(@RequestBody AdminScheduleRequest request) {
        Schedule schedule = new Schedule();
        applySchedule(schedule, request);
        return scheduleRepository.save(schedule);
    }

    @PutMapping("/schedules/{id}")
    @Transactional
    public Schedule updateSchedule(@PathVariable Long id, @RequestBody AdminScheduleRequest request) {
        Schedule schedule = scheduleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        applySchedule(schedule, request);
        return scheduleRepository.save(schedule);
    }

    private Bus applyBus(Bus bus, AdminBusRequest request) {
        if (request.getOperatorId() == null || request.getPrimaryDriverId() == null) {
            throw new IllegalArgumentException("An operator and primary driver are required");
        }
        bus.setBusNumber(request.getBusNumber());
        bus.setBusRegistrationNumber(request.getBusRegistrationNumber());
        bus.setOperatorRecord(operatorRepository.findById(request.getOperatorId())
            .orElseThrow(() -> new IllegalArgumentException("Operator not found")));
        bus.setPrimaryDriver(driverRepository.findById(request.getPrimaryDriverId())
            .orElseThrow(() -> new IllegalArgumentException("Driver not found")));
        bus.setBusType(request.getBusType());
        bus.setSeatCapacity(request.getSeatCapacity());
        bus.setModel(request.getModel());
        bus.setManufacturingYear(request.getManufacturingYear());
        bus.setAc(request.isAc());
        bus.setSleeper(request.isSleeper());
        bus.setWifi(request.isWifi());
        bus.setCharging(request.isCharging());
        bus.setBlanket(request.isBlanket());
        bus.setWaterBottle(request.isWaterBottle());
        bus.setStatus(request.getStatus());
        List<Integer> amenityIds = request.getAmenityIds() == null ? List.of() : request.getAmenityIds();
        List<Amenity> amenities = amenityRepository.findAllById(amenityIds);
        if (amenities.size() != amenityIds.stream().distinct().count()) {
            throw new IllegalArgumentException("One or more amenities were not found");
        }
        bus.setAmenityRecords(new java.util.LinkedHashSet<>(amenities));
        return bus;
    }

    private void applySchedule(Schedule schedule, AdminScheduleRequest request) {
        if (request.getBusId() == null || request.getRouteId() == null
                || request.getBoardingPointId() == null || request.getDroppingPointId() == null
                || request.getTravelDate() == null || request.getDepartureTime() == null
                || request.getArrivalTime() == null || request.getFare() == null) {
            throw new IllegalArgumentException("Bus, route, boarding/drop points, date, times, and fare are required");
        }

        Bus bus = busRepository.findById(request.getBusId())
            .orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        Route route = routeRepository.findById(request.getRouteId())
            .orElseThrow(() -> new IllegalArgumentException("Route not found"));
        BoardingPoint boardingPoint = boardingPointRepository.findById(request.getBoardingPointId())
            .orElseThrow(() -> new IllegalArgumentException("Boarding point not found"));
        BoardingPoint droppingPoint = boardingPointRepository.findById(request.getDroppingPointId())
            .orElseThrow(() -> new IllegalArgumentException("Dropping point not found"));

        if (!route.getSource().equalsIgnoreCase(boardingPoint.getCityName())
                || !route.getDestination().equalsIgnoreCase(droppingPoint.getCityName())) {
            throw new IllegalArgumentException("Boarding and dropping points must match the route cities");
        }

        schedule.setBus(bus);
        schedule.setRoute(route);
        schedule.setBoardingPoint(boardingPoint);
        schedule.setDroppingPoint(droppingPoint);
        schedule.setTravelDate(request.getTravelDate());
        schedule.setDepartureTime(request.getDepartureTime());
        schedule.setArrivalTime(request.getArrivalTime());
        schedule.setFare(request.getFare());
        schedule.setStatus("SCHEDULED");
    }

    private City requireCity(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            throw new IllegalArgumentException("Route endpoints must be existing cities");
        }
        return cityRepository.findByNameIgnoreCase(cityName.trim())
            .orElseThrow(() -> new IllegalArgumentException("Route endpoints must be existing cities"));
    }
}
